'use client';

import { useEffect, useState } from 'react';
import { Loader2, Coins } from 'lucide-react';
import { getCreditTransactions } from '@/lib/payment-api';
import { Badge } from '@/components/ui/badge';
import type { CreditTransactionResponse } from '@/types/payment.types';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('vi-VN');

// Color class map for known transaction types
const TYPE_COLORS: Record<string, string> = {
  PURCHASE:    'bg-blue-100 text-blue-700 border-blue-200',
  USAGE:       'bg-orange-100 text-orange-700 border-orange-200',
  REFUND:      'bg-green-100 text-green-700 border-green-200',
  BONUS:       'bg-purple-100 text-purple-700 border-purple-200',
  ADJUSTMENT:  'bg-gray-100 text-gray-600 border-gray-200',
};

const TYPE_LABELS: Record<string, string> = {
  PURCHASE:   'Mua',
  USAGE:      'Sử dụng',
  REFUND:     'Hoàn tiền',
  BONUS:      'Thưởng',
  ADJUSTMENT: 'Điều chỉnh',
};

function TypeBadge({ type }: { type: string }) {
  return (
    <Badge className={TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
      {TYPE_LABELS[type] ?? type}
    </Badge>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<CreditTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && <p className="text-center text-red-500 py-8">{error}</p>}

      {!loading && !error && (
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Mô tả', 'Số lượng', 'Loại', 'Số dư sau', 'Ngày'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
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
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{tx.description}</td>
                    <td className={`px-4 py-3 font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                    <td className="px-4 py-3 text-gray-600">{tx.balanceAfter.toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(tx.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
