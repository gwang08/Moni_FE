'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Receipt } from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { getPayments } from '@/lib/payment-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PaymentResponse } from '@/types/payment.types';

const formatVND = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + ' đ';

const formatDate = (dateStr: string | null) =>
  dateStr ? new Date(dateStr).toLocaleString('vi-VN') : '—';

type StatusKey = 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

const STATUS_CONFIG: Record<StatusKey, { label: string; className: string }> = {
  SUCCESS:   { label: 'Thành công', className: 'bg-green-100 text-green-700 border-green-200' },
  PENDING:   { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  FAILED:    { label: 'Thất bại',  className: 'bg-red-100 text-red-700 border-red-200' },
  CANCELLED: { label: 'Đã hủy',   className: 'bg-gray-100 text-gray-600 border-gray-200' },
  EXPIRED:   { label: 'Hết hạn',   className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusKey] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPayments()
      .then(setPayments)
      .catch(() => setError('Không thể tải lịch sử thanh toán.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/payment">
            <ArrowLeft className="h-4 w-4 mr-1" />Quay lại
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Lịch sử thanh toán</h1>
        </div>
      </div>

      {loading && <SkeletonTable rows={5} cols={5} />}

      {error && <p className="text-center text-red-500 py-8">{error}</p>}

      {!loading && !error && (
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Mã GD', 'Số tiền', 'Trạng thái', 'Cập nhật'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">Chưa có giao dịch nào</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium">{p.txnCode}</td>
                    <td className="px-4 py-3">{formatVND(p.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(p.updatedAt)}</td>
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
