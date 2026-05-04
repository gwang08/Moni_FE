'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { SkeletonTable } from '@/components/ui/skeleton';
import { getAdminCreditTransactions } from '@/lib/admin-api';
import { getPayments } from '@/lib/payment-api';
import { formatDate } from '@/lib/format-date';
import { formatVnd } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PaymentResponse } from '@/types/payment.types';
import type { CreditTransactionResponse } from '@/types/payment.types';

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const PAGE_SIZE = 10;

function normalizeText(value: string | null | undefined) {
  return (value || '').toLowerCase().trim();
}

function getPaymentLabel(payment: PaymentResponse) {
  return payment.packageName || payment.subscriptionPlanName || '-';
}

function getPaymentKind(payment: PaymentResponse) {
  const status = payment.status.toUpperCase();
  if (status === 'REFUNDED' || status === 'REFUND') return 'Hoàn tiền';
  if (payment.packageId != null || payment.subscriptionPlanId != null) return 'Thanh toán';
  return 'Khác';
}

function getStatusConfig(status: string) {
  const key = status.toUpperCase();
  if (key === 'SUCCESS' || key === 'COMPLETED' || key === 'PAID') {
    return { label: 'Thành công', color: 'bg-emerald-100 text-emerald-700' };
  }
  if (key === 'PENDING' || key === 'PROCESSING') {
    return { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700' };
  }
  if (key === 'FAILED' || key === 'CANCELLED' || key === 'EXPIRED') {
    return { label: 'Thất bại', color: 'bg-rose-100 text-rose-700' };
  }
  return { label: status, color: 'bg-gray-100 text-gray-700' };
}

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
  const fromDateFromUrl = searchParams.get('fromDate') || formatDateInput(defaultFromDate);
  const toDateFromUrl = searchParams.get('toDate') || formatDateInput(today);
  const sortFromUrl = searchParams.get('sort') || 'desc';

  const [page, setPage] = useState(pageFromUrl);
  const [search, setSearch] = useState(searchFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(sortFromUrl as 'asc' | 'desc');
  const [dateRange, setDateRange] = useState({
    startDate: fromDateFromUrl,
    endDate: toDateFromUrl,
  });

  const updateUrl = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || (key === 'sort' && value === 'desc')) {
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
      if (debouncedSearch !== search) {
        setDebouncedSearch(search);
        updateUrl({ search: search || null, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch, updateUrl]);

  useEffect(() => {
    setPage(pageFromUrl);
    setSearch(searchFromUrl);
    setDebouncedSearch(searchFromUrl);
    setSortOrder(sortFromUrl as 'asc' | 'desc');
    setDateRange({
      startDate: fromDateFromUrl,
      endDate: toDateFromUrl,
    });
  }, [pageFromUrl, searchFromUrl, fromDateFromUrl, toDateFromUrl, sortFromUrl]);

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => getPayments(),
  });

  const { data: creditTransactions = [] } = useQuery({
    queryKey: ['admin', 'credit-transactions', dateRange],
    queryFn: () =>
      getAdminCreditTransactions({
        paymentType: 'SUBSCRIPTION_PURCHASE',
        fromDate: dateRange.startDate || undefined,
        toDate: dateRange.endDate || undefined,
      }),
  });

  const transactionMetaByPaymentId = useMemo(() => {
    return creditTransactions.reduce<Record<number, CreditTransactionResponse>>((acc, tx) => {
      if (tx.paymentId != null && tx.paymentType === 'SUBSCRIPTION_PURCHASE') {
        acc[tx.paymentId] = tx;
      }
      return acc;
    }, {});
  }, [creditTransactions]);

  const filteredData = useMemo(() => {
    const fromTs = new Date(`${dateRange.startDate}T00:00:00`).getTime();
    const toTs = new Date(`${dateRange.endDate}T23:59:59.999`).getTime();
    const query = normalizeText(debouncedSearch);

    return data
      .filter((payment) => payment.status === 'SUCCESS')
      .map((payment) => {
        const meta = transactionMetaByPaymentId[payment.id];
        return {
          ...payment,
          userId: payment.userId ?? meta?.userId ?? null,
          userEmail: payment.userEmail ?? meta?.userEmail ?? null,
          userFullName: payment.userFullName ?? meta?.userFullName ?? null,
        };
      })
      .filter((payment) => {
        const ts = new Date(payment.updatedAt || payment.createdAt || '').getTime();
        if (Number.isFinite(fromTs) && ts < fromTs) return false;
        if (Number.isFinite(toTs) && ts > toTs) return false;

        if (!query) return true;

        const searchable = [
          payment.userFullName,
          payment.userEmail,
          payment.txnCode,
          payment.packageName,
          payment.subscriptionPlanName,
          payment.status,
        ]
          .map(normalizeText)
          .join(' ');

        return searchable.includes(query);
      })
      .filter((payment) => payment.packageId != null || payment.subscriptionPlanId != null);
  }, [data, dateRange, debouncedSearch, transactionMetaByPaymentId]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || '').getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || '').getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [filteredData, sortOrder]);

  const totalElements = sortedData.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedData.slice(start, start + PAGE_SIZE);
  }, [sortedData, page]);

  return (
    <div>
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[300px] flex-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm kiếm"
              className="h-10"
            />
          </div>

          <div className="min-w-[280px]">
            <DateRangePicker
              value={dateRange}
              onChange={(range) => {
                setDateRange(range);
                updateUrl({
                  fromDate: range.startDate,
                  toDate: range.endDate,
                  page: 1,
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
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Gói mua</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Loại</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Số tiền</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400">
                        Không có giao dịch nào
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((payment) => {
                      const statusCfg = getStatusConfig(payment.status);
                      const packageLabel = getPaymentLabel(payment);
                      const kindLabel = getPaymentKind(payment);
                      const timestamp = payment.updatedAt || payment.createdAt || '';

                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-700">
                            {payment.userFullName || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {payment.userEmail || payment.userId || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{packageLabel}</td>
                          <td className="px-4 py-3 text-gray-700">{kindLabel}</td>
                          <td className="px-4 py-3 font-medium text-right text-emerald-600">
                            {formatVnd(payment.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {timestamp ? formatDate(timestamp) : '-'}
                          </td>
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
                  const pages: Array<number | string> = [];
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
