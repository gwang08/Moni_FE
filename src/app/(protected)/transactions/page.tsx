'use client';

import { useEffect, useState, useRef } from 'react';
import { Coins } from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { getCreditTransactions } from '@/lib/payment-api';
import { Badge } from '@/components/ui/badge';
import type { CreditTransactionResponse } from '@/types/payment.types';
import { formatDate } from '@/lib/format-date';

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  TOPUP: { label: 'Nạp tiền', color: 'bg-green-100 text-green-700' },
  CONSUME: { label: 'Sử dụng', color: 'bg-orange-100 text-orange-700' },
  REFUND: { label: 'Hoàn tiền', color: 'bg-blue-100 text-blue-700' },
};

const TYPE_FILTERS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'TOPUP', label: 'Nạp tiền' },
  { value: 'CONSUME', label: 'Sử dụng' },
  { value: 'REFUND', label: 'Hoàn tiền' },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<CreditTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    getCreditTransactions()
      .then(setTransactions)
      .catch(() => setError('Không thể tải lịch sử giao dịch.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions
    .filter(tx => typeFilter === 'ALL' || tx.paymentType === typeFilter)
    .sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? tb - ta : ta - tb;
    });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Coins className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Lịch sử tín dụng</h1>
      </div>

      {/* Filter bar */}
      {!loading && !error && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {TYPE_FILTERS.map(f => (
              <button key={f.value} type="button"
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${typeFilter === f.value ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="text-xs border rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
      )}

      {loading && <SkeletonTable rows={5} cols={5} />}

      {error && <p className="text-center text-red-500 py-8">{error}</p>}

      {!loading && !error && (
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Dịch vụ', 'Số credit', 'Loại', 'Số dư sau', 'Thời gian'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    Không có giao dịch nào
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const cfg = TYPE_CONFIG[tx.paymentType] ?? { label: tx.paymentType, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700">
                        {tx.serviceName || tx.packageName || (tx.paymentType === 'TOPUP' ? 'Nạp credit' : '—')}
                      </td>
                      <td className={`px-4 py-3 font-semibold tabular-nums ${tx.delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.delta >= 0 ? '+' : ''}{tx.delta}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cfg.color}>{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">{tx.balanceAfter}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(tx.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
