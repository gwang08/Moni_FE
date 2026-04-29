'use client';

import { ArrowDown, ArrowUp, RotateCcw, Sparkles, Wrench, Clock, XCircle } from 'lucide-react';
import type { CreditTransactionResponse } from '@/types/payment.types';
import { formatDate } from '@/lib/format-date';
import { formatVnd } from '@/lib/utils';

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
  LATE_PAYMENT_TOPUP: {
    label: 'Nạp (trễ)',
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
    label: 'Hoàn lượt',
    tint: 'text-blue-700 bg-blue-50 border-blue-100',
    icon: RotateCcw,
    iconBg: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-600',
  },
  SUBSCRIPTION_PURCHASE: {
    label: 'Mua gói',
    tint: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    icon: Sparkles,
    iconBg: 'bg-indigo-50 border-indigo-100',
    iconColor: 'text-indigo-600',
  },
  CREDIT_ADJUSTMENT: {
    label: 'Điều chỉnh',
    tint: 'text-amber-700 bg-amber-50 border-amber-100',
    icon: Wrench,
    iconBg: 'bg-amber-50 border-amber-100',
    iconColor: 'text-amber-600',
  },
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    tint: 'text-orange-700 bg-orange-50 border-orange-100',
    icon: Clock,
    iconBg: 'bg-orange-50 border-orange-100',
    iconColor: 'text-orange-600',
  },
  EXPIRED_PAYMENT: {
    label: 'Hết hạn',
    tint: 'text-gray-700 bg-gray-50 border-gray-100',
    icon: XCircle,
    iconBg: 'bg-gray-50 border-gray-100',
    iconColor: 'text-gray-600',
  },
};

// Cols: icon | loại | chi tiết | số tiền | số lượt (quota) | thời gian
const COLS = 'grid-cols-[40px_100px_1fr_100px_140px_140px] gap-4';

export function TransactionsTable({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-16 text-center">
        <p className="text-[14px] font-bold text-slate-600">Chưa có giao dịch nào</p>
        <p className="text-[12.5px] text-slate-400 mt-1 font-medium">Mua gói để bắt đầu dùng dịch vụ AI</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className={`hidden md:grid ${COLS} px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 text-[10.5px] font-black text-slate-500 uppercase tracking-widest`}>
        <div></div>
        <div>Loại</div>
        <div>Chi tiết</div>
        <div className="text-center">Số tiền</div>
        <div className="text-center">Số lượt</div>
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
    tx.remark ||
    tx.serviceName ||
    tx.packageName ||
    (tx.paymentType === 'TOPUP' ? 'Nạp tiền' : 'Giao dịch');
  const isSubPurchase = tx.paymentType === 'SUBSCRIPTION_PURCHASE';
  const isConsume = tx.paymentType === 'CONSUME';
  const isQuotaConsume = !!tx.quotaType;

  // Sub purchase: BE ghi remark "Mua Gói X · 2,000đ". Extract amount.
  const subPurchaseAmount = (() => {
    if (!isSubPurchase || !tx.remark) return null;
    const m = tx.remark.match(/·\s*([\d.,]+)đ/);
    return m ? m[1] + 'đ' : null;
  })();

  const isPendingExpired = tx.paymentType === 'PENDING_PAYMENT' || tx.paymentType === 'EXPIRED_PAYMENT';

  const isExpertQuota = tx.quotaType === 'EXPERT';
  const quotaIsUnlimited = tx.quotaBefore === -1 || tx.quotaAfter === -1;
  const quotaBeforeAfterText = quotaIsUnlimited
    ? 'Không giới hạn'
    : `${tx.quotaBefore} → ${tx.quotaAfter} ${isExpertQuota ? 'GV' : 'AI'}`;

  // Delta số lượt — dùng quotaAfter - quotaBefore để xác định +/- chính xác (REFUND là +, CONSUME là -)
  const quotaDelta = quotaIsUnlimited ? 0 : (tx.quotaAfter ?? 0) - (tx.quotaBefore ?? 0);
  const isRefund = tx.paymentType === 'REFUND' || quotaDelta > 0;
  const quotaDeltaLabel = quotaDelta > 0 ? `+${quotaDelta} lượt` : `${quotaDelta} lượt`;
  const quotaDeltaColor = isRefund ? 'text-blue-600' : isExpertQuota ? 'text-purple-600' : 'text-indigo-600';

  // Số tiền: ẩn cho loại CONSUME (chấm AI), hiện cho mua gói/nạp tiền/hoàn/điều chỉnh
  const showAmount = !isConsume;

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
        {/* Số tiền */}
        <span className={`text-center text-[13px] font-black tabular-nums ${
          isSubPurchase ? 'text-indigo-600' : isPendingExpired ? (tx.paymentType === 'PENDING_PAYMENT' ? 'text-orange-600' : 'text-gray-500') : tx.delta > 0 ? 'text-emerald-600' : tx.delta < 0 ? 'text-rose-600' : 'text-slate-300'
        }`}>
          {showAmount
            ? isSubPurchase
              ? (subPurchaseAmount ?? '—')
              : isPendingExpired
                ? formatVnd(tx.delta)
                : tx.delta !== 0
                  ? (tx.delta >= 0 ? '+' : '') + formatVnd(Math.abs(tx.delta))
                  : '—'
            : '—'}
        </span>
        {/* Số lượt */}
        <div className="text-center">
          {isQuotaConsume ? (
            <>
              <div className={`text-[14px] font-black leading-none ${quotaDeltaColor}`}>
                {quotaDeltaLabel}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 tabular-nums mt-1">
                {quotaBeforeAfterText}
              </div>
            </>
          ) : (
            <span className="text-slate-300 text-xs">—</span>
          )}
        </div>
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
          {isQuotaConsume ? (
            <>
              <div className={`text-[14px] font-black tabular-nums ${quotaDeltaColor}`}>
                {quotaDeltaLabel}
              </div>
              <div className="text-[10.5px] text-slate-400 font-semibold tabular-nums">{quotaBeforeAfterText}</div>
            </>
          ) : isSubPurchase ? (
            <div className="text-[14px] font-black tabular-nums text-indigo-600">
              {subPurchaseAmount ?? '—'}
            </div>
          ) : isPendingExpired ? (
            <div className={`text-[14px] font-black tabular-nums ${tx.paymentType === 'PENDING_PAYMENT' ? 'text-orange-600' : 'text-gray-500'}`}>
              {formatVnd(tx.delta)}
            </div>
          ) : tx.delta !== 0 && showAmount ? (
            <div className={`text-[14px] font-black tabular-nums ${tx.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {(tx.delta >= 0 ? '+' : '') + formatVnd(Math.abs(tx.delta))}
            </div>
          ) : (
            <span className="text-slate-300 text-xs">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
