'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { SkeletonTable } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format-date';
import { approveLatePayment, getPayments, refundDuplicatePayment } from '@/lib/payment-api';
import { formatVnd } from '@/lib/utils';

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

function getStatusConfig(status: string) {
  const key = status.toUpperCase();
  if (key === 'SUCCESS' || key === 'LATE_SUCCESS') {
    return { label: 'Thành công', color: 'bg-emerald-100 text-emerald-700' };
  }
  if (key === 'PENDING' || key === 'PROCESSING') {
    return { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700' };
  }
  if (key === 'LATE_PAYMENT') {
    return { label: 'Chờ duyệt', color: 'bg-orange-100 text-orange-700' };
  }
  if (key === 'DUPLICATE') {
    return { label: 'Trùng', color: 'bg-violet-100 text-violet-700' };
  }
  if (key === 'REFUNDED') {
    return { label: 'Đã hoàn', color: 'bg-sky-100 text-sky-700' };
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
  const statusFromUrl = searchParams.get('status') || 'ALL';

  const [page, setPage] = useState(pageFromUrl);
  const [search, setSearch] = useState(searchFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(sortFromUrl as 'asc' | 'desc');
  const [statusFilter, setStatusFilter] = useState(statusFromUrl);
  const [dateRange, setDateRange] = useState({
    startDate: fromDateFromUrl,
    endDate: toDateFromUrl,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const updateUrl = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || (key === 'sort' && value === 'desc') || (key === 'status' && value === 'ALL')) {
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
    setStatusFilter(statusFromUrl);
    setDateRange({
      startDate: fromDateFromUrl,
      endDate: toDateFromUrl,
    });
  }, [pageFromUrl, searchFromUrl, fromDateFromUrl, toDateFromUrl, sortFromUrl, statusFromUrl]);

  const paymentsQuery = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => getPayments(),
  });

  const rows = paymentsQuery.data ?? [];

  const filteredRows = useMemo(() => {
    const fromTs = new Date(`${dateRange.startDate}T00:00:00`).getTime();
    const toTs = new Date(`${dateRange.endDate}T23:59:59.999`).getTime();
    const query = normalizeText(debouncedSearch);

    return rows
      .filter((payment) => {
        const ts = new Date(payment.createdAt || payment.updatedAt || '').getTime();
        if (Number.isFinite(fromTs) && ts < fromTs) return false;
        if (Number.isFinite(toTs) && ts > toTs) return false;
        return true;
      })
      .filter((payment) => {
        if (!statusFilter || statusFilter === 'ALL') return true;
        const s = payment.status.toUpperCase();
        if (statusFilter === 'SUCCESS') return s === 'SUCCESS' || s === 'LATE_SUCCESS';
        if (statusFilter === 'PENDING') return s === 'PENDING' || s === 'PROCESSING';
        if (statusFilter === 'FAILED') return s === 'FAILED' || s === 'CANCELLED' || s === 'EXPIRED';
        return s === statusFilter;
      })
      .filter((payment) => {
        if (!query) return true;
        const searchable = [
          payment.userFullName,
          payment.userEmail,
          payment.txnCode,
          payment.packageName,
          payment.subscriptionPlanName,
          payment.status,
          String(payment.amount),
        ]
          .map(normalizeText)
          .join(' ');
        return searchable.includes(query);
      });
  }, [rows, dateRange, debouncedSearch, statusFilter]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || '').getTime();
      const dateB = new Date(b.createdAt || b.updatedAt || '').getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [filteredRows, sortOrder]);

  const totalElements = sortedRows.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [sortedRows, page]);

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  const refreshData = async () => {
    await paymentsQuery.refetch();
  };

  const handleApproveLate = async (paymentId: number) => {
    setActionLoading(`late-${paymentId}`);
    try {
      await approveLatePayment(paymentId);
      await refreshData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefundDuplicate = async (paymentId: number) => {
    setActionLoading(`duplicate-${paymentId}`);
    try {
      await refundDuplicatePayment(paymentId);
      await refreshData();
    } finally {
      setActionLoading(null);
    }
  };

  const isLoading = paymentsQuery.isLoading;
  const hasError = Boolean(paymentsQuery.error);

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

          <div className="min-w-[160px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val);
                updateUrl({ status: val === 'ALL' ? null : val, page: 1 });
              }}
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SUCCESS">Thành công</option>
              <option value="PENDING">Đang xử lý</option>
              <option value="LATE_PAYMENT">Chờ duyệt</option>
              <option value="DUPLICATE">Trùng</option>
              <option value="REFUNDED">Đã hoàn</option>
              <option value="FAILED">Thất bại</option>
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
          <SkeletonTable rows={PAGE_SIZE} cols={7} />
        ) : hasError ? (
          <p className="py-8 text-center text-red-500">Không thể tải danh sách giao dịch</p>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="w-[14.28%] px-4 py-3 text-left font-medium text-gray-600">Người dùng</th>
                    <th className="w-[14.28%] px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="w-[14.28%] px-4 py-3 text-left font-medium text-gray-600">Gói mua</th>
                    <th className="w-[14.28%] px-4 py-3 text-left font-medium text-gray-600">Số tiền</th>
                    <th className="w-[14.28%] px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                    <th className="w-[14.28%] px-4 py-3 text-left font-medium text-gray-600">Thời gian</th>
                    <th className="w-[14.28%] px-4 py-3 text-left font-medium text-gray-600">Xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400">
                        Không có giao dịch nào
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((payment) => {
                      const statusCfg = getStatusConfig(payment.status);
                      const timestamp = payment.createdAt || payment.updatedAt || '';
                      const isActionLoading = actionLoading === `late-${payment.id}` || actionLoading === `duplicate-${payment.id}`;
                      const status = payment.status.toUpperCase();
                      const canApproveLate = status === 'LATE_PAYMENT';
                      const canRefundDuplicate = status === 'DUPLICATE';

                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="w-[14%] px-4 py-3 font-medium text-gray-700 truncate max-w-0" title={payment.userFullName || ''}>
                            {payment.userFullName || '-'}
                          </td>
                          <td className="w-[18%] px-4 py-3 text-gray-500 truncate max-w-0" title={payment.userEmail || payment.userId || ''}>
                            {payment.userEmail || payment.userId || '-'}
                          </td>
                          <td className="w-[18%] px-4 py-3 text-gray-700 truncate max-w-0" title={payment.packageName || payment.subscriptionPlanName || ''}>
                            {payment.packageName || payment.subscriptionPlanName || '-'}
                          </td>
                          <td className="w-[15%] pl-4 pr-8 py-3 font-medium text-right text-emerald-600">
                            {formatVnd(payment.amount)}
                          </td>
                          <td className="w-[15%] px-4 py-3">
                            <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                          </td>
                          <td className="w-[14%] px-4 py-3 text-xs text-gray-500">
                            {timestamp ? formatDate(timestamp) : '-'}
                          </td>
                          <td className="w-[6%] px-4 py-3">
                            {canApproveLate ? (
                              <Button
                                size="sm"
                                onClick={() => handleApproveLate(payment.id)}
                                disabled={isActionLoading}
                                className="rounded-lg"
                              >
                                {isActionLoading ? 'Đang xử lý...' : 'Duyệt late'}
                              </Button>
                            ) : canRefundDuplicate ? (
                              <Button
                                size="sm"
                                onClick={() => handleRefundDuplicate(payment.id)}
                                disabled={isActionLoading}
                                className="rounded-lg"
                              >
                                {isActionLoading ? 'Đang xử lý...' : 'Hoàn tiền'}
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
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
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
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
