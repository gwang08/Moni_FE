'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { SkeletonTable } from '@/components/ui/skeleton';
import { AdminHeader } from '@/components/admin/admin-header';
import { getAdminCreditTransactions } from '@/lib/admin-api';
import { formatDate } from '@/lib/format-date';
import { useQuery } from '@tanstack/react-query';

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  TOPUP: { label: 'Nap tien', color: 'bg-green-100 text-green-700' },
  CONSUME: { label: 'Su dung', color: 'bg-orange-100 text-orange-700' },
  REFUND: { label: 'Refund', color: 'bg-blue-100 text-blue-700' },
};

const TYPE_FILTERS = [
  { value: 'ALL', label: 'Tat ca' },
  { value: 'TOPUP', label: 'Nap tien' },
  { value: 'CONSUME', label: 'Su dung' },
  { value: 'REFUND', label: 'Refund' },
];

export default function AdminUserTransactionsPage() {
  const today = useMemo(() => new Date(), []);
  const defaultFromDate = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 30);
    return date;
  }, [today]);

  const [userId, setUserId] = useState('');
  const [paymentType, setPaymentType] = useState('ALL');
  const [fromDate, setFromDate] = useState(formatDateInput(defaultFromDate));
  const [toDate, setToDate] = useState(formatDateInput(today));

  const [appliedUserId, setAppliedUserId] = useState('');
  const [appliedPaymentType, setAppliedPaymentType] = useState('ALL');
  const [appliedFromDate, setAppliedFromDate] = useState(formatDateInput(defaultFromDate));
  const [appliedToDate, setAppliedToDate] = useState(formatDateInput(today));

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'user-transactions', appliedUserId, appliedPaymentType, appliedFromDate, appliedToDate],
    queryFn: () =>
      getAdminCreditTransactions({
        userId: appliedUserId || undefined,
        paymentType: appliedPaymentType,
        fromDate: appliedFromDate || undefined,
        toDate: appliedToDate || undefined,
      }),
  });

  return (
    <div>
      <AdminHeader title="Giao dịch user" />
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-700">Loc giao dich phuc vu refund</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-64 flex-col gap-1">
              <span className="text-xs text-gray-500">User ID</span>
              <input
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="Nhap userId can tra cuu"
                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Loai giao dich</span>
              <select
                value={paymentType}
                onChange={(event) => setPaymentType(event.target.value)}
                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TYPE_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Tu ngay</span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Den ngay</span>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setAppliedUserId(userId.trim());
                setAppliedPaymentType(paymentType);
                setAppliedFromDate(fromDate);
                setAppliedToDate(toDate);
              }}
              className="h-10 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Tim kiem
            </button>
          </div>
        </div>

        {isLoading ? (
          <SkeletonTable rows={7} cols={8} />
        ) : error ? (
          <p className="py-8 text-center text-red-500">Khong the tai danh sach giao dich</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Dich vu / Goi</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">So credit</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Loai</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">So du sau</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Payment ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Thoi gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      Khong co giao dich nao
                    </td>
                  </tr>
                ) : (
                  data.map((tx) => {
                    const cfg = TYPE_CONFIG[tx.paymentType] ?? { label: tx.paymentType, color: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">
                          <p className="font-medium">{tx.userFullName || tx.userEmail || tx.userId}</p>
                          <p className="text-xs text-gray-500">{tx.userEmail || tx.userId}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{tx.serviceName || tx.packageName || '-'}</td>
                        <td className={`px-4 py-3 font-semibold tabular-nums ${tx.delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.delta >= 0 ? '+' : ''}
                          {tx.delta}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cfg.color}>{cfg.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 tabular-nums">{tx.balanceAfter}</td>
                        <td className="px-4 py-3 text-gray-600">{tx.paymentId ?? '-'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(tx.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
