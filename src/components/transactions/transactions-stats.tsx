'use client';

import { Wallet, ArrowDownToLine, ArrowUpFromLine, Receipt, RotateCcw } from 'lucide-react';
import type { CreditTransactionResponse } from '@/types/payment.types';

interface Props {
  balance: number;
  transactions: CreditTransactionResponse[];
}

/** Extract số tiền VND từ remark của SUBSCRIPTION_PURCHASE (BE format "Mua Gói X · 2,000đ"). */
function parseSubAmount(remark: string | null | undefined): number {
  if (!remark) return 0;
  const m = remark.match(/·\s*([\d.,]+)đ/);
  if (!m) return 0;
  const n = parseInt(m[1].replace(/[.,]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Rút gọn số tiền lớn thành K/M/B để không vỡ layout card stats.
 * Trả về [number, suffix] để render số + đơn vị với typography khác nhau.
 */
function splitCompactVnd(amount: number): { num: string; unit: string } {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return { num: `${sign}${(abs / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}`, unit: 'B đ' };
  }
  if (abs >= 1_000_000) {
    return { num: `${sign}${(abs / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}`, unit: 'M đ' };
  }
  if (abs >= 10_000) {
    return { num: `${sign}${(abs / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}`, unit: 'K đ' };
  }
  return { num: `${sign}${abs.toLocaleString('vi-VN')}`, unit: 'đ' };
}

/** Tone preset cho từng card — cùng cấu trúc, chỉ khác màu. */
type Tone = 'teal' | 'emerald' | 'rose' | 'blue' | 'slate';
const TONE_MAP: Record<Tone, { card: string; label: string; value: string; unit: string; icon: string; hint: string }> = {
  teal: {
    card: 'rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-sm p-5 relative overflow-hidden',
    label: 'text-white/80',
    value: 'text-white',
    unit: 'text-white/80',
    icon: 'text-white',
    hint: 'text-emerald-100',
  },
  emerald: {
    card: 'rounded-2xl bg-white border border-slate-100 shadow-sm p-5 relative overflow-hidden',
    label: 'text-slate-400',
    value: 'text-emerald-600',
    unit: 'text-emerald-500/70',
    icon: 'text-emerald-500',
    hint: 'text-slate-500',
  },
  rose: {
    card: 'rounded-2xl bg-white border border-slate-100 shadow-sm p-5 relative overflow-hidden',
    label: 'text-slate-400',
    value: 'text-rose-600',
    unit: 'text-rose-500/70',
    icon: 'text-rose-500',
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

// 5 stats cards: Số dư + Tổng nạp / Tổng tiêu / Tổng hoàn / Giao dịch
// - Tổng nạp = TOPUP/LATE_PAYMENT_TOPUP + SUBSCRIPTION_PURCHASE mua bằng QR (delta=0, tiền vào hệ thống)
// - Tổng tiêu = CONSUME delta<0 + SUBSCRIPTION_PURCHASE mua bằng ví (delta<0, trừ tiền ví)
// - Tổng hoàn = REFUND (VND vào ví + số lượt quota được hoàn lại)
export function TransactionsStats({ balance, transactions }: Props) {
  const topupFromWallet = transactions
    .filter((t) => t.paymentType === 'TOPUP' || t.paymentType === 'LATE_PAYMENT_TOPUP')
    .reduce((s, t) => s + t.delta, 0);
  const topupFromSubsQr = transactions
    .filter((t) => t.paymentType === 'SUBSCRIPTION_PURCHASE' && t.delta === 0)
    .reduce((s, t) => s + parseSubAmount(t.remark), 0);
  const topup = topupFromWallet + topupFromSubsQr;

  const consumeFromUsage = transactions
    .filter((t) => t.paymentType === 'CONSUME' && t.delta < 0)
    .reduce((s, t) => s + Math.abs(t.delta), 0);
  const consumeFromSubsWallet = transactions
    .filter((t) => t.paymentType === 'SUBSCRIPTION_PURCHASE' && t.delta < 0)
    .reduce((s, t) => s + Math.abs(t.delta), 0);
  const consume = consumeFromUsage + consumeFromSubsWallet;

  const refunds = transactions.filter((t) => t.paymentType === 'REFUND');
  const refundVnd = refunds
    .filter((t) => !t.quotaType && t.delta > 0)
    .reduce((s, t) => s + t.delta, 0);
  const refundQuotaCount = refunds.filter((t) => !!t.quotaType).length;

  // Số giao dịch thực tế trừ tiền khỏi ví: consume delta<0 + subscription mua bằng ví.
  // KHÔNG đếm CONSUME delta=0 (chỉ là trừ quota của gói, không phải tiêu tiền).
  const paidTxnCount =
    transactions.filter((t) => t.paymentType === 'CONSUME' && t.delta < 0).length +
    transactions.filter((t) => t.paymentType === 'SUBSCRIPTION_PURCHASE' && t.delta < 0).length;
  const total = transactions.length;

  const balanceSplit = splitCompactVnd(balance);
  const topupSplit = splitCompactVnd(topup);
  const consumeSplit = splitCompactVnd(consume);
  const refundSplit = splitCompactVnd(refundVnd);

  // Tổng hoàn: hiển thị VND nếu có tiền, quota lượt nếu chỉ có quota.
  const refundOnlyQuota = refundVnd === 0 && refundQuotaCount > 0;
  const refundNum = refundOnlyQuota ? `+${refundQuotaCount}` : refundVnd > 0 ? `+${refundSplit.num}` : '0';
  const refundUnit = refundOnlyQuota ? 'lượt' : refundSplit.unit;
  const refundFull = refundVnd > 0 ? `+${refundVnd.toLocaleString('vi-VN')}đ` : refundOnlyQuota ? `+${refundQuotaCount} lượt` : '0đ';
  const refundHint = refundVnd > 0 && refundQuotaCount > 0
    ? `Kèm ${refundQuotaCount} lượt quota hoàn`
    : refundOnlyQuota
      ? 'Hoàn vào gói subscription'
      : refundVnd > 0
        ? 'Hoàn vào ví'
        : 'Chưa có hoàn';

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard
        tone="teal"
        label="Số dư"
        num={balanceSplit.num}
        unit={balanceSplit.unit}
        fullValue={`${balance.toLocaleString('vi-VN')}đ`}
        icon={<Wallet className="h-4 w-4" />}
        hint="Số dư dùng cho AI & giảng viên"
        decorative
      />
      <StatCard
        tone="emerald"
        label="Tổng nạp"
        num={`+${topupSplit.num}`}
        unit={topupSplit.unit}
        fullValue={`+${topup.toLocaleString('vi-VN')}đ`}
        icon={<ArrowDownToLine className="h-4 w-4" />}
        hint="Gồm nạp ví + mua gói"
      />
      <StatCard
        tone="rose"
        label="Tổng tiêu"
        num={`−${consumeSplit.num}`}
        unit={consumeSplit.unit}
        fullValue={`−${consume.toLocaleString('vi-VN')}đ`}
        icon={<ArrowUpFromLine className="h-4 w-4" />}
        hint={paidTxnCount === 0 ? 'Chưa có chi tiêu' : `${paidTxnCount} giao dịch trừ ví`}
      />
      <StatCard
        tone="blue"
        label="Tổng hoàn"
        num={refundNum}
        unit={refundUnit}
        fullValue={refundFull}
        icon={<RotateCcw className="h-4 w-4" />}
        hint={refundHint}
      />
      <StatCard
        tone="slate"
        label="Giao dịch"
        num={String(total)}
        unit=""
        fullValue={String(total)}
        icon={<Receipt className="h-4 w-4" />}
        hint={total === 0 ? 'Chưa có giao dịch' : 'Tổng cộng'}
      />
    </div>
  );
}

interface StatCardProps {
  tone: Tone;
  label: string;
  /** Phần số chính hiển thị cỡ lớn. */
  num: string;
  /** Đơn vị đi kèm (M đ, K đ, đ, lượt...) hiển thị cỡ nhỏ bên cạnh số. */
  unit: string;
  /** Số tiền đầy đủ hiển thị qua tooltip khi giá trị đã rút gọn (K/M/B). */
  fullValue: string;
  icon: React.ReactNode;
  hint: string;
  /** Thêm blob trang trí góc phải trên (dùng cho BalanceCard gradient). */
  decorative?: boolean;
}

function StatCard({ tone, label, num, unit, fullValue, icon, hint, decorative }: StatCardProps) {
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
        <div
          className={`mt-1 tabular-nums truncate flex items-baseline gap-1 ${t.value}`}
          title={fullValue}
        >
          <span className="text-[28px] font-black leading-tight">{num}</span>
          {unit && <span className={`text-[14px] font-bold ${t.unit}`}>{unit}</span>}
        </div>
        <div className={`text-[11.5px] font-bold mt-0.5 truncate ${t.hint}`}>{hint}</div>
      </div>
    </div>
  );
}
