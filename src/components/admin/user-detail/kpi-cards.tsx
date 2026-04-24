'use client';

import { BookOpenCheck, Clock, Award, Flame, GraduationCap, Bot } from 'lucide-react';

interface Props {
  totalAttempts: number;
  totalSeconds: number;
  currentBand: number | null;
  targetBand: number | null;
  aiCount: number;
  expertCount: number;
  streak: number;
}

function formatHours(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function KpiCards({ totalAttempts, totalSeconds, currentBand, targetBand, aiCount, expertCount, streak }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Kpi
        icon={<BookOpenCheck className="h-4 w-4 text-gray-400" />}
        label="Tổng bài đã làm"
        value={totalAttempts.toString()}
      />
      <Kpi
        icon={<Clock className="h-4 w-4 text-gray-400" />}
        label="Tổng thời gian"
        value={formatHours(totalSeconds)}
      />
      <Kpi
        icon={<Award className="h-4 w-4 text-emerald-500" />}
        label="Band hiện tại"
        value={currentBand != null ? currentBand.toFixed(1) : '—'}
        hint={targetBand != null ? `Mục tiêu ${targetBand}` : undefined}
        accent
      />
      <Kpi
        icon={<Flame className="h-4 w-4 text-amber-500" />}
        label="Streak"
        value={`${streak} ngày`}
      />
      <Kpi
        icon={<GraduationCap className="h-4 w-4 text-gray-400" />}
        label="AI / Expert"
        value={`${aiCount} / ${expertCount}`}
        hint={<span className="flex items-center gap-1"><Bot className="h-3 w-3" />AI <GraduationCap className="h-3 w-3 ml-1" />Expert</span>}
      />
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 uppercase tracking-wide font-medium">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${accent ? 'text-emerald-600' : 'text-gray-800'}`}>{value}</div>
      {hint && <div className="text-[11px] text-gray-400 mt-0.5">{hint}</div>}
    </div>
  );
}
