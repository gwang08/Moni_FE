'use client';

import { Wallet, ArrowDownToLine, ArrowUpFromLine, Receipt } from 'lucide-react';
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

// 4 stats cards: Số dư (gradient) + Tổng nạp / Tổng tiêu / Giao dịch
// Tổng nạp = TOPUP vào ví + SUBSCRIPTION_PURCHASE (user chi tiền ra ngoài → vào Moni)
// Tổng tiêu = CONSUME (VND trừ khỏi ví)
export function TransactionsStats({ balance, transactions }: Props) {
  const topupFromWallet = transactions.filter((t) => t.delta > 0).reduce((s, t) => s + t.delta, 0);
  const topupFromSubs = transactions
    .filter((t) => t.paymentType === 'SUBSCRIPTION_PURCHASE')
    .reduce((s, t) => s + parseSubAmount(t.remark), 0);
  const topup = topupFromWallet + topupFromSubs;
  const consume = transactions.filter((t) => t.delta < 0).reduce((s, t) => s + Math.abs(t.delta), 0);
  const total = transactions.length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <BalanceCard balance={balance} />
      <StatCard
        label="Tổng nạp"
        value={`+${topup.toLocaleString('vi-VN')}`}
        valueClass="text-emerald-600"
        icon={<ArrowDownToLine className="h-4 w-4 text-emerald-500" />}
        hint="30 ngày gần nhất"
      />
      <StatCard
        label="Tổng tiêu"
        value={`−${consume.toLocaleString('vi-VN')}`}
        valueClass="text-rose-600"
        icon={<ArrowUpFromLine className="h-4 w-4 text-rose-500" />}
        hint={`${transactions.filter((t) => t.delta < 0).length} lượt dùng`}
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
        <div className="text-[30px] font-black mt-1 tabular-nums flex items-baseline gap-1">
          {balance.toLocaleString('vi-VN')}
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
  valueClass = '',
  icon,
  hint,
}: {
  label: string;
  value: string;
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
      <div className={`text-[30px] font-black mt-1 tabular-nums ${valueClass}`}>{value}</div>
      <div className="text-[11.5px] text-slate-500 font-bold mt-0.5 truncate">{hint}</div>
    </div>
  );
}
