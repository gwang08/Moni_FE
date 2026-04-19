'use client';

import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import type { CreditTransactionResponse } from '@/types/payment.types';
import { formatDate } from '@/lib/format-date';

interface Props {
  transactions: CreditTransactionResponse[];
}

const TYPE_META: Record<string, { label: string; tint: string; icon: React.ElementType; iconBg: string; iconColor: string }> = {
  TOPUP: {
    label: 'Nạp tiền',
    tint: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    icon: ArrowDown,
    iconBg: 'bg-emerald-50 border-emerald-100',
    iconColor: 'text-emerald-600',
  },
  CONSUME: {
    label: 'Sử dụng',
    tint: 'text-rose-700 bg-rose-50 border-rose-100',
    icon: ArrowUp,
    iconBg: 'bg-rose-50 border-rose-100',
    iconColor: 'text-rose-600',
  },
  REFUND: {
    label: 'Hoàn tiền',
    tint: 'text-blue-700 bg-blue-50 border-blue-100',
    icon: RotateCcw,
    iconBg: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-600',
  },
};

// Nới cột số + gap để "Số đậu" và "Số dư sau" không dính sát nhau
const COLS = 'grid-cols-[40px_110px_1fr_110px_120px_150px] gap-5';

export function TransactionsTable({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-16 text-center">
        <p className="text-[14px] font-bold text-slate-600">Chưa có giao dịch nào</p>
        <p className="text-[12.5px] text-slate-400 mt-1 font-medium">Nạp đậu để bắt đầu dùng dịch vụ AI</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className={`hidden md:grid ${COLS} px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 text-[10.5px] font-black text-slate-500 uppercase tracking-widest`}>
        <div></div>
        <div>Loại</div>
        <div>Chi tiết</div>
        <div className="text-center">Số đậu</div>
        <div className="text-center">Số dư sau</div>
        <div>Thời gian</div>
      </div>

      <div className="divide-y divide-slate-100">
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: CreditTransactionResponse }) {
  const meta = TYPE_META[tx.paymentType] ?? TYPE_META.CONSUME;
  const Icon = meta.icon;
  const detail =
    tx.serviceName || tx.packageName || (tx.paymentType === 'TOPUP' ? 'Nạp đậu' : 'Giao dịch');
  const isPositive = tx.delta >= 0;

  return (
    <div>
      {/* Desktop row */}
      <div className={`hidden md:grid ${COLS} px-4 py-3 items-center hover:bg-slate-50/40 transition-colors`}>
        <div className={`h-8 w-8 rounded-full grid place-items-center border ${meta.iconBg}`}>
          <Icon className={`h-3.5 w-3.5 ${meta.iconColor}`} />
        </div>
        <span className={`text-[10.5px] font-black border px-2 py-0.5 rounded-full uppercase tracking-widest w-fit whitespace-nowrap ${meta.tint}`}>
          {meta.label}
        </span>
        <div className="text-[13px] font-bold text-slate-900 truncate">{detail}</div>
        <span className={`text-center text-[14px] font-black tabular-nums ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? '+' : ''}
          {tx.delta}
        </span>
        <span className="text-center text-[12px] font-semibold text-slate-600 tabular-nums">{tx.balanceAfter}</span>
        <span className="text-[11.5px] text-slate-500 font-semibold tabular-nums whitespace-nowrap">{formatDate(tx.createdAt)}</span>
      </div>

      {/* Mobile card */}
      <div className="md:hidden p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full grid place-items-center border shrink-0 ${meta.iconBg}`}>
          <Icon className={`h-4 w-4 ${meta.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-black border px-2 py-0.5 rounded-full uppercase tracking-widest ${meta.tint}`}>
              {meta.label}
            </span>
          </div>
          <div className="text-[13px] font-bold text-slate-900 truncate">{detail}</div>
          <div className="text-[11px] text-slate-500 font-semibold tabular-nums">{formatDate(tx.createdAt)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-[16px] font-black tabular-nums ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? '+' : ''}
            {tx.delta}
          </div>
          <div className="text-[10.5px] text-slate-400 font-semibold tabular-nums">Dư {tx.balanceAfter}</div>
        </div>
      </div>
    </div>
  );
}
