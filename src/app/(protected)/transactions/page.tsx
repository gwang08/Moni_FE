'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Receipt, ShoppingCart, Wallet } from 'lucide-react';
import { getCreditTransactions } from '@/lib/payment-api';
import type { CreditTransactionResponse } from '@/types/payment.types';
import { TransactionsTable } from '@/components/transactions/transactions-table';

type PaymentFilter = 'ALL' | 'SUBSCRIPTION_PURCHASE' | 'CONSUME' | 'REFUND';

const FILTER_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'SUBSCRIPTION_PURCHASE', label: 'Mua gói' },
  { value: 'CONSUME', label: 'Sử dụng' },
  { value: 'REFUND', label: 'Hoàn lượt' },
];

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<CreditTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<PaymentFilter>('ALL');
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

  const isPurchase = (type: string) =>
    type === 'SUBSCRIPTION_PURCHASE' || type === 'TOPUP' || type === 'LATE_PAYMENT_TOPUP';

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (typeFilter === 'ALL') return true;
        if (typeFilter === 'SUBSCRIPTION_PURCHASE') return isPurchase(tx.paymentType);
        return tx.paymentType === typeFilter;
      })
      .sort((a, b) => {
        const ta = new Date(a.createdAt).getTime();
        const tb = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? tb - ta : ta - tb;
      });
  }, [transactions, typeFilter, sortOrder]);

  const totalSpent = useMemo(() => {
    let sum = 0;
    for (const t of transactions) {
      if (t.delta < 0) {
        sum += Math.abs(t.delta);
      } else if (isPurchase(t.paymentType)) {
        if (t.remark) {
          const m = t.remark.match(/·\s*([\d.,]+)đ/);
          if (m) sum += Number(m[1].replace(/[.,]/g, ''));
        } else if (t.delta > 0) {
          sum += t.delta;
        }
      }
    }
    return sum;
  }, [transactions]);

  const countByType = (type: PaymentFilter) => {
    if (type === 'ALL') return transactions.length;
    if (type === 'SUBSCRIPTION_PURCHASE') return transactions.filter((t) => isPurchase(t.paymentType)).length;
    return transactions.filter((t) => t.paymentType === type).length;
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Hero */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-[26px] md:text-[30px] font-black tracking-tight">Lịch sử giao dịch</h1>
            <p className="text-[13.5px] text-slate-500 font-medium mt-1">Theo dõi mọi giao dịch mua gói và chấm bài.</p>
          </div>
          <button
            onClick={() => router.push('/payment')}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-[13px] font-bold inline-flex items-center gap-2 hover:bg-teal-700 w-fit"
          >
            <ShoppingCart className="h-4 w-4" />
            Mua gói
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tổng chi tiêu</span>
              <Wallet className="h-4 w-4 text-teal-500" />
            </div>
            <div className="mt-1 text-[28px] font-black text-teal-600">
              {totalSpent.toLocaleString('vi-VN')}đ
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tổng giao dịch</span>
              <Receipt className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-1 text-[28px] font-black text-slate-900">{transactions.length}</div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Mua gói</span>
              <ShoppingCart className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-1 text-[28px] font-black text-indigo-600">
              {countByType('SUBSCRIPTION_PURCHASE')}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Sử dụng</span>
            </div>
            <div className="mt-1 text-[28px] font-black text-rose-600">
              {transactions.filter((t) => t.paymentType === 'CONSUME').length}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 overflow-x-auto max-w-full">
            {FILTER_OPTIONS.map((f) => {
              const active = typeFilter === f.value;
              const count = countByType(f.value);
              return (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={`px-3 py-1.5 rounded-md text-[12.5px] font-bold whitespace-nowrap transition-colors ${
                    active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  {f.label} <span className="text-slate-400 font-semibold">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="px-3 h-9 rounded-lg bg-slate-50 border border-slate-200 text-[12.5px] font-bold text-slate-700 focus:bg-white focus:border-teal-400 focus:outline-none"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/30 p-12 text-center">
            <p className="text-[14px] font-bold text-rose-700">{error}</p>
          </div>
        ) : (
          <TransactionsTable transactions={filtered} />
        )}
      </div>
    </div>
  );
}
