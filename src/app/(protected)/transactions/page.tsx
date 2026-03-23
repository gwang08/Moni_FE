'use client';

import { useEffect, useState, useRef } from 'react';
import { Coins } from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { getCreditTransactions } from '@/lib/payment-api';
import { Badge } from '@/components/ui/badge';
import type { CreditTransactionResponse } from '@/types/payment.types';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('vi-VN');

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  TOPUP: { label: 'Nạp tiền', color: 'bg-green-100 text-green-700' },
  CONSUME: { label: 'Sử dụng', color: 'bg-orange-100 text-orange-700' },
  REFUND: { label: 'Hoàn tiền', color: 'bg-blue-100 text-blue-700' },
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<CreditTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    getCreditTransactions()
      .then(setTransactions)
      .catch(() => setError('Không thể tải lịch sử giao dịch.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Coins className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Lịch sử tín dụng</h1>
      </div>

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
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    Chưa có giao dịch nào
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const cfg = TYPE_CONFIG[tx.paymentType] ?? { label: tx.paymentType, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700">
                        {tx.serviceName || (tx.paymentType === 'TOPUP' ? 'Nạp credit' : '—')}
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
