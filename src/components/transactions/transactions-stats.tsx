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
 * < 1M giữ nguyên format VND; >= 1M chuyển thành 1.2M, 504M, 1.5B (vi-VN locale).
 */
function formatCompactVnd(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}M`;
  if (abs >= 10_000) return `${sign}${(abs / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}K`;
  return `${sign}${abs.toLocaleString('vi-VN')}`;
}

// 5 stats cards: Số dư + Tổng nạp / Tổng tiêu / Tổng hoàn / Giao dịch
// - Tổng nạp = TOPUP/LATE_PAYMENT_TOPUP + SUBSCRIPTION_PURCHASE mua bằng QR (delta=0, tiền vào hệ thống)
// - Tổng tiêu = CONSUME delta<0 + SUBSCRIPTION_PURCHASE mua bằng ví (delta<0, trừ tiền ví)
// - Tổng hoàn = REFUND (VND vào ví + số lượt quota được hoàn lại)
export function TransactionsStats({ balance, transactions }: Props) {
  // Nạp ví: TOPUP/LATE_PAYMENT_TOPUP + SUBSCRIPTION_PURCHASE qua QR (delta=0 vì tiền
  // đi thẳng vào hệ thống, không qua số dư ví). KHÔNG gồm REFUND dù delta>0.
  const topupFromWallet = transactions
    .filter((t) => t.paymentType === 'TOPUP' || t.paymentType === 'LATE_PAYMENT_TOPUP')
    .reduce((s, t) => s + t.delta, 0);
  const topupFromSubsQr = transactions
    .filter((t) => t.paymentType === 'SUBSCRIPTION_PURCHASE' && t.delta === 0)
    .reduce((s, t) => s + parseSubAmount(t.remark), 0);
  const topup = topupFromWallet + topupFromSubsQr;

  // Tiêu: CONSUME delta<0 + SUBSCRIPTION_PURCHASE mua bằng ví (delta<0, trừ trực tiếp
  // từ số dư ví). Quota consume có delta=0 nên không count ở đây.
  const consumeFromUsage = transactions
    .filter((t) => t.paymentType === 'CONSUME' && t.delta < 0)
    .reduce((s, t) => s + Math.abs(t.delta), 0);
  const consumeFromSubsWallet = transactions
    .filter((t) => t.paymentType === 'SUBSCRIPTION_PURCHASE' && t.delta < 0)
    .reduce((s, t) => s + Math.abs(t.delta), 0);
  const consume = consumeFromUsage + consumeFromSubsWallet;

  // Hoàn: REFUND tiền VND (quotaType=null, delta>0) + số lượt quota được hoàn (quotaType!=null).
  const refunds = transactions.filter((t) => t.paymentType === 'REFUND');
  const refundVnd = refunds
    .filter((t) => !t.quotaType && t.delta > 0)
    .reduce((s, t) => s + t.delta, 0);
  const refundQuotaCount = refunds.filter((t) => !!t.quotaType).length;

  const totalLuotDung = transactions.filter((t) => t.paymentType === 'CONSUME').length;
  const total = transactions.length;

  const refundValue = refundVnd > 0
    ? `+${formatCompactVnd(refundVnd)}đ`
    : refundQuotaCount > 0
      ? `+${refundQuotaCount} lượt`
      : '0đ';
  const refundFullValue = refundVnd > 0
    ? `+${refundVnd.toLocaleString('vi-VN')}đ`
    : refundValue;
  const refundHint = refundVnd > 0 && refundQuotaCount > 0
    ? `Kèm ${refundQuotaCount} lượt quota hoàn`
    : refundQuotaCount > 0 && refundVnd === 0
      ? 'Hoàn vào gói subscription'
      : refundVnd > 0
        ? 'Hoàn vào ví'
        : 'Chưa có hoàn';

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <BalanceCard balance={balance} />
      <StatCard
        label="Tổng nạp"
        value={`+${formatCompactVnd(topup)}đ`}
        fullValue={`+${topup.toLocaleString('vi-VN')}đ`}
        valueClass="text-emerald-600"
        icon={<ArrowDownToLine className="h-4 w-4 text-emerald-500" />}
        hint="Gồm nạp ví + mua gói"
      />
      <StatCard
        label="Tổng tiêu"
        value={`−${formatCompactVnd(consume)}đ`}
        fullValue={`−${consume.toLocaleString('vi-VN')}đ`}
        valueClass="text-rose-600"
        icon={<ArrowUpFromLine className="h-4 w-4 text-rose-500" />}
        hint={`${totalLuotDung} lượt dùng (gói + ví)`}
      />
      <StatCard
        label="Tổng hoàn"
        value={refundValue}
        fullValue={refundFullValue}
        valueClass="text-blue-600"
        icon={<RotateCcw className="h-4 w-4 text-blue-500" />}
        hint={refundHint}
      />
      <StatCard
        label="Giao dịch"
        value={String(total)}
        icon={<Receipt className="h-4 w-4 text-slate-400" />}
        hint={total === 0 ? 'Chưa có giao dịch' : 'Tổng cộng'}
      />
    </div>
  );
}

function BalanceCard({ balance }: { balance: number }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-sm p-5 relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">Số dư</span>
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <div
          className="text-[30px] font-black mt-1 tabular-nums flex items-baseline gap-1 truncate"
          title={`${balance.toLocaleString('vi-VN')}đ`}
        >
          {formatCompactVnd(balance)}
          <span className="text-[14px] font-bold text-white/80">đ</span>
        </div>
        <div className="text-[11.5px] text-emerald-100 font-bold mt-0.5 truncate">Số dư dùng cho AI &amp; giảng viên</div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  fullValue,
  valueClass = '',
  icon,
  hint,
}: {
  label: string;
  value: string;
  /** Số tiền đầy đủ hiển thị qua tooltip khi giá trị đã rút gọn (K/M/B). */
  fullValue?: string;
  valueClass?: string;
  icon: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <div
        className={`text-[30px] font-black mt-1 tabular-nums truncate ${valueClass}`}
        title={fullValue ?? value}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-slate-500 font-bold mt-0.5 truncate">{hint}</div>
    </div>
  );
}
