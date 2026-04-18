'use client';

import { NotebookPen, CheckCheck, Clock, Sparkles } from 'lucide-react';
import type { HistoryEntry } from './use-unified-history';

interface Props {
  entries: HistoryEntry[];
}

// 4 ô stats: Tổng · Đã chấm · Chưa chấm · Band TB (avg từ các entry có band)
export function HistoryStats({ entries }: Props) {
  const total = entries.length;
  const completed = entries.filter((e) => e.status === 'COMPLETED').length;
  const pending = entries.filter((e) => e.status === 'PENDING' || e.status === 'PROCESSING').length;

  const bands = entries.map((e) => e.band).filter((b): b is number => typeof b === 'number' && b > 0);
  const avgBand = bands.length > 0 ? bands.reduce((a, b) => a + b, 0) / bands.length : 0;

  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Tổng bài"
        value={total.toString()}
        icon={<NotebookPen className="h-4 w-4 text-slate-400" />}
        hint={`${entries.filter((e) => e.kind === 'writing').length} writing · ${entries.filter((e) => e.kind === 'reading').length} reading`}
      />
      <StatCard
        label="Đã chấm"
        value={completed.toString()}
        valueClass="text-emerald-600"
        icon={<CheckCheck className="h-4 w-4 text-emerald-500" />}
        hint={`${completedPct}% hoàn tất`}
      />
      <StatCard
        label="Chưa chấm"
        value={pending.toString()}
        valueClass="text-amber-600"
        icon={<Clock className="h-4 w-4 text-amber-500" />}
        hint={pending > 0 ? 'Đang chờ xử lý' : 'Tất cả đã chấm'}
      />
      <StatCardGradient label="Band TB" value={avgBand > 0 ? avgBand.toFixed(1) : '—'} />
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

function StatCardGradient({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-sm p-5 relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">{label}</span>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="text-[30px] font-black mt-1 tabular-nums">{value}</div>
        <div className="text-[11.5px] text-emerald-100 font-bold mt-0.5">Trung bình các bài đã chấm</div>
      </div>
    </div>
  );
}
