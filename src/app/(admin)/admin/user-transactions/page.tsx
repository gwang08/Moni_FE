'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { SkeletonTable } from '@/components/ui/skeleton';
import { AdminHeader } from '@/components/admin/admin-header';
import { getAdminCreditTransactions } from '@/lib/admin-api';
import { formatDate } from '@/lib/format-date';
import { useQuery } from '@tanstack/react-query';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  SUBSCRIPTION_PURCHASE: { label: 'Mua gói', color: 'bg-green-100 text-green-700' },
  TOPUP: { label: 'Nạp tiền', color: 'bg-green-100 text-green-700' },
  CONSUME: { label: 'Thanh toán', color: 'bg-orange-100 text-orange-700' },
  REFUND: { label: 'Hoàn lượt', color: 'bg-blue-100 text-blue-700' },
};

const TYPE_FILTERS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'SUBSCRIPTION_PURCHASE', label: 'Mua gói' },
  { value: 'CONSUME', label: 'Thanh toán' },
  { value: 'REFUND', label: 'Hoàn lượt' },
];

const PAGE_SIZE = 10;

export default function AdminUserTransactionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const today = useMemo(() => new Date(), []);
  const defaultFromDate = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 30);
    return date;
  }, [today]);

  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const searchFromUrl = searchParams.get('search') || '';
  const typeFromUrl = searchParams.get('type') || 'ALL';
  const fromDateFromUrl = searchParams.get('fromDate') || formatDateInput(defaultFromDate);
  const toDateFromUrl = searchParams.get('toDate') || formatDateInput(today);
  const sortFromUrl = searchParams.get('sort') || 'desc';

  const [page, setPage] = useState(pageFromUrl);
  const [userId, setUserId] = useState(searchFromUrl);
  const [debouncedUserId, setDebouncedUserId] = useState(searchFromUrl);
  const [paymentType, setPaymentType] = useState(typeFromUrl);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(sortFromUrl as 'asc' | 'desc');
  const [dateRange, setDateRange] = useState({
    startDate: fromDateFromUrl,
    endDate: toDateFromUrl,
  });

  const updateUrl = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || (key === 'type' && value === 'ALL') || (key === 'sort' && value === 'desc')) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedUserId !== userId) {
        setDebouncedUserId(userId);
        updateUrl({ search: userId || null, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [userId, debouncedUserId, updateUrl]);

  useEffect(() => {
    setPage(pageFromUrl);
    setUserId(searchFromUrl);
    setDebouncedUserId(searchFromUrl);
    setPaymentType(typeFromUrl);
    setSortOrder(sortFromUrl as 'asc' | 'desc');
    setDateRange({
      startDate: fromDateFromUrl,
      endDate: toDateFromUrl,
    });
  }, [pageFromUrl, searchFromUrl, typeFromUrl, fromDateFromUrl, toDateFromUrl, sortFromUrl]);

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'user-transactions', debouncedUserId, paymentType, dateRange],
    queryFn: () =>
      getAdminCreditTransactions({
        userId: debouncedUserId.trim() || undefined,
        paymentType,
        fromDate: dateRange.startDate || undefined,
        toDate: dateRange.endDate || undefined,
      }),
  });

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [data, sortOrder]);

  const totalElements = sortedData.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedData.slice(start, start + PAGE_SIZE);
  }, [sortedData, page]);

  return (
    <div>
      <AdminHeader title="Giao dịch" />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[300px] flex-1">
            <Input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Tìm kiếm"
              className="h-10"
            />
          </div>

          <div className="min-w-[160px]">
            <select
              value={paymentType}
              onChange={(event) => {
                const val = event.target.value;
                setPaymentType(val);
                updateUrl({ type: val, page: 1 });
              }}
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TYPE_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[280px]">
            <DateRangePicker
              value={dateRange}
              onChange={(range) => {
                setDateRange(range);
                updateUrl({ 
                  fromDate: range.startDate, 
                  toDate: range.endDate, 
                  page: 1 
                });
              }}
            />
          </div>

          <div className="min-w-[140px]">
            <select
              value={sortOrder}
              onChange={(event) => {
                const val = event.target.value as 'asc' | 'desc';
                setSortOrder(val);
                updateUrl({ sort: val, page: 1 });
              }}
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Mới nhất</option>
              <option value="asc">Cũ nhất</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <SkeletonTable rows={PAGE_SIZE} cols={6} />
        ) : error ? (
          <p className="py-8 text-center text-red-500">Không thể tải danh sách giao dịch</p>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Người dùng</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Dịch vụ</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Gói mua</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Giá tiền</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Credit</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Loại</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-gray-400">
                        Không có giao dịch nào
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((tx) => {
                      const cfg = TYPE_CONFIG[tx.paymentType] ?? { label: tx.paymentType, color: 'bg-gray-100 text-gray-600' };
                      
                      let deltaDisplay = '';
                      let deltaColor = '';
                      
                      if (tx.paymentType === 'CONSUME') {
                        deltaDisplay = `-${Math.abs(tx.delta)}`;
                        deltaColor = 'text-orange-600';
                      } else if (tx.paymentType === 'SUBSCRIPTION_PURCHASE' || tx.paymentType === 'TOPUP') {
                        deltaDisplay = `+${tx.delta}`;
                        deltaColor = 'text-green-600';
                      } else {
                        deltaDisplay = tx.delta >= 0 ? `+${tx.delta}` : `${tx.delta}`;
                        deltaColor = tx.delta >= 0 ? 'text-green-600' : 'text-red-500';
                      }

                      let packagePurchased = tx.packageName || '-';
                      let priceStr = '-';

                      if (tx.paymentType === 'SUBSCRIPTION_PURCHASE' && tx.remark) {
                        const parts = tx.remark.split(' · ');
                        if (parts.length === 2) {
                          packagePurchased = parts[0].replace(/^Mua\s+/i, '');
                          priceStr = parts[1];
                        } else {
                          packagePurchased = tx.remark;
                        }
                      }

                      return (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-700">
                            {tx.userFullName || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {tx.userEmail || tx.userId}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{tx.serviceName || '-'}</td>
                          <td className="px-4 py-3 text-gray-700">{packagePurchased}</td>
                          <td className="px-4 py-3 font-medium text-right text-emerald-600">
                            {priceStr}
                          </td>
                          <td className={`px-4 py-3 font-bold tabular-nums text-right ${deltaColor}`}>
                            {deltaDisplay}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cfg.color}>{cfg.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{formatDate(tx.createdAt)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="px-2"
                >
                  Trước
                </Button>

                {(() => {
                  const pages = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (page > 4) pages.push('...');
                    const start = Math.max(2, page - 2);
                    const end = Math.min(totalPages - 1, page + 2);
                    for (let i = start; i <= end; i++) {
                      if (!pages.includes(i)) pages.push(i);
                    }
                    if (page < totalPages - 3) pages.push('...');
                    pages.push(totalPages);
                  }

                  return pages.map((p, idx) => {
                    if (p === '...') {
                      return <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>;
                    }
                    return (
                      <Button
                        key={`page-${p}`}
                        variant={page === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(p as number)}
                        className={`w-9 ${page === p ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      >
                        {p}
                      </Button>
                    );
                  });
                })()}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="px-2"
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
