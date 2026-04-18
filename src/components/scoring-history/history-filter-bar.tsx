'use client';

import { Search } from 'lucide-react';
import type { HistoryEntry, HistoryKind, HistoryStatus } from './use-unified-history';

export type SkillFilter = 'all' | HistoryKind;
export type StatusFilter = 'all' | HistoryStatus;

interface Props {
  entries: HistoryEntry[];
  skill: SkillFilter;
  onSkillChange: (s: SkillFilter) => void;
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

const SKILL_TABS: { key: SkillFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'writing', label: 'Writing' },
  { key: 'reading', label: 'Reading' },
  { key: 'listening', label: 'Listening' },
  { key: 'speaking', label: 'Speaking' },
];

const STATUS_CHIPS: { key: StatusFilter; label: string; dot: string }[] = [
  { key: 'COMPLETED', label: 'Đã chấm', dot: 'bg-emerald-500' },
  { key: 'PENDING', label: 'Chưa chấm', dot: 'bg-amber-500' },
  { key: 'PROCESSING', label: 'Đang chấm', dot: 'bg-indigo-500' },
];

export function HistoryFilterBar({
  entries,
  skill,
  onSkillChange,
  status,
  onStatusChange,
  search,
  onSearchChange,
}: Props) {
  const countByKind = (k: SkillFilter) =>
    k === 'all' ? entries.length : entries.filter((e) => e.kind === k).length;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-3 flex flex-wrap items-center gap-3">
      {/* Skill segmented */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto max-w-full">
        {SKILL_TABS.map((t) => {
          const active = skill === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onSkillChange(t.key)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold whitespace-nowrap transition-colors ${
                active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              {t.label} <span className={active ? 'text-slate-400 font-semibold' : 'text-slate-400 font-semibold'}>{countByKind(t.key)}</span>
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-slate-200 hidden md:block" />

      {/* Status chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_CHIPS.map((c) => {
          const active = status === c.key;
          return (
            <button
              key={c.key}
              onClick={() => onStatusChange(active ? 'all' : c.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-bold transition-colors ${
                active
                  ? 'bg-slate-900 text-white border border-slate-900'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${c.dot}`} />
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-3 h-9 rounded-lg bg-slate-50 border border-slate-200 text-[13px] font-medium w-56 focus:bg-white focus:border-teal-400 focus:outline-none"
          placeholder="Tìm bài viết..."
        />
      </div>
    </div>
  );
}
