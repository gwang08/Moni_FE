'use client';

import { Sparkles, ArrowUpFromLine, RotateCcw, Receipt } from 'lucide-react';
import type { CreditTransactionResponse } from '@/types/payment.types';

interface Props {
  transactions: CreditTransactionResponse[];
}

type Tone = 'teal' | 'indigo' | 'blue' | 'slate';
const TONE_MAP: Record<Tone, { card: string; label: string; value: string; unit: string; icon: string; hint: string }> = {
  teal: {
    card: 'rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-sm p-5 relative overflow-hidden',
    label: 'text-white/80',
    value: 'text-white',
    unit: 'text-white/80',
    icon: 'text-white',
    hint: 'text-emerald-100',
  },
  indigo: {
    card: 'rounded-2xl bg-white border border-slate-100 shadow-sm p-5 relative overflow-hidden',
    label: 'text-slate-400',
    value: 'text-indigo-600',
    unit: 'text-indigo-500/70',
    icon: 'text-indigo-500',
    hint: 'text-slate-500',
  },
  blue: {
    card: 'rounded-2xl bg-white border border-slate-100 shadow-sm p-5 relative overflow-hidden',
    label: 'text-slate-400',
    value: 'text-blue-600',
    unit: 'text-blue-500/70',
    icon: 'text-blue-500',
    hint: 'text-slate-500',
  },
  slate: {
    card: 'rounded-2xl bg-white border border-slate-100 shadow-sm p-5 relative overflow-hidden',
    label: 'text-slate-400',
    value: 'text-slate-900',
    unit: 'text-slate-500',
    icon: 'text-slate-400',
    hint: 'text-slate-500',
  },
};

export function TransactionsStats({ transactions }: Props) {
  const quotaUsed = transactions.filter((t) => t.paymentType === 'CONSUME' && !!t.quotaType).length;
  const freeTurns = transactions.filter((t) => t.paymentType === 'CONSUME' && !t.quotaType && t.delta === 0).length;
  const totalUsed = quotaUsed + freeTurns;

  const refunds = transactions.filter((t) => t.paymentType === 'REFUND');
  const refundQuotaCount = refunds.filter((t) => !!t.quotaType).length;

  const total = transactions.length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        tone="teal"
        label="Lượt đã dùng"
        num={String(totalUsed)}
        unit="lượt"
        icon={<ArrowUpFromLine className="h-4 w-4" />}
        hint={`${freeTurns} miễn phí · ${quotaUsed} từ gói`}
        decorative
      />
      <StatCard
        tone="indigo"
        label="Mua gói"
        num={String(transactions.filter((t) => t.paymentType === 'SUBSCRIPTION_PURCHASE').length)}
        unit=""
        icon={<Sparkles className="h-4 w-4" />}
        hint="Số lần mua gói subscription"
      />
      <StatCard
        tone="blue"
        label="Tổng hoàn"
        num={refundQuotaCount > 0 ? `+${refundQuotaCount}` : '0'}
        unit="lượt"
        icon={<RotateCcw className="h-4 w-4" />}
        hint={refundQuotaCount > 0 ? 'Hoàn vào gói subscription' : 'Chưa có hoàn'}
      />
      <StatCard
        tone="slate"
        label="Giao dịch"
        num={String(total)}
        unit=""
        icon={<Receipt className="h-4 w-4" />}
        hint={total === 0 ? 'Chưa có giao dịch' : 'Tổng cộng'}
      />
    </div>
  );
}

interface StatCardProps {
  tone: Tone;
  label: string;
  num: string;
  unit: string;
  icon: React.ReactNode;
  hint: string;
  decorative?: boolean;
}

function StatCard({ tone, label, num, unit, icon, hint, decorative }: StatCardProps) {
  const t = TONE_MAP[tone];
  return (
    <div className={t.card}>
      {decorative && (
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 blur-xl pointer-events-none" />
      )}
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-black uppercase tracking-widest ${t.label}`}>{label}</span>
          <span className={t.icon}>{icon}</span>
        </div>
        <div className={`mt-1 tabular-nums truncate flex items-baseline gap-1 ${t.value}`}>
          <span className="text-[28px] font-black leading-tight">{num}</span>
          {unit && <span className={`text-[14px] font-bold ${t.unit}`}>{unit}</span>}
        </div>
        <div className={`text-[11.5px] font-bold mt-0.5 truncate ${t.hint}`}>{hint}</div>
      </div>
    </div>
  );
}
