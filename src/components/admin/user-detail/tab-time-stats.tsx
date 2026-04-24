'use client';

import { useMemo } from 'react';
import { BookOpen, Headphones, Pencil, Mic, Bot, GraduationCap } from 'lucide-react';
import type { AttemptHistory } from '@/lib/practice-api';
import type { WritingSubmission } from '@/lib/ai-api';
import type { ScoringSession } from '@/types/expert.types';

interface Props {
  attempts: AttemptHistory[];
  writing: WritingSubmission[];
  sessions: ScoringSession[];
}

const SKILLS = [
  { key: 'READING', label: 'Reading', icon: BookOpen },
  { key: 'LISTENING', label: 'Listening', icon: Headphones },
  { key: 'WRITING', label: 'Writing', icon: Pencil },
  { key: 'SPEAKING', label: 'Speaking', icon: Mic },
] as const;

function formatHours(sec: number) {
  if (sec === 0) return '0';
  const h = sec / 3600;
  return h >= 1 ? `${h.toFixed(1)}h` : `${Math.round(sec / 60)}m`;
}

export function TabTimeStats({ attempts, writing, sessions }: Props) {
  // Total time per skill
  const timePerSkill = useMemo(() => {
    const m: Record<string, number> = { READING: 0, LISTENING: 0, WRITING: 0, SPEAKING: 0 };
    attempts.forEach((a) => {
      const s = a.skill ?? 'READING';
      if (m[s] != null) m[s] += Math.max(0, a.elapsedSeconds);
    });
    return m;
  }, [attempts]);

  // Count per skill
  const countPerSkill = useMemo(() => {
    const m: Record<string, number> = { READING: 0, LISTENING: 0, WRITING: 0, SPEAKING: 0 };
    attempts.forEach((a) => {
      const s = a.skill ?? 'READING';
      if (m[s] != null) m[s] += 1;
    });
    writing.forEach(() => { m.WRITING += 1; });
    sessions.forEach((s) => {
      if (m[s.skill] != null) m[s.skill] += 1;
    });
    return m;
  }, [attempts, writing, sessions]);

  const totalTime = Object.values(timePerSkill).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(1, ...Object.values(countPerSkill));

  // AI vs Expert
  const aiCount = attempts.length + writing.length;
  const expertCount = sessions.length;
  const totalSource = aiCount + expertCount;

  // Daily activity heatmap (30d)
  const heatmap = useMemo(() => {
    const days = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = new Array(days).fill(0) as number[];

    [...attempts.map((a) => a.submittedAt ?? a.startedAt),
      ...writing.map((w) => w.submittedAt),
      ...sessions.map((s) => s.createdAt ?? s.submittedAt)].forEach((iso) => {
      if (!iso) return;
      const d = new Date(iso);
      d.setHours(0, 0, 0, 0);
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < days) buckets[days - 1 - diff] += 1;
    });

    const max = Math.max(1, ...buckets);
    return buckets.map((c) => ({ count: c, intensity: c / max }));
  }, [attempts, writing, sessions]);

  const activeDays = heatmap.filter((h) => h.count > 0).length;
  const avgPerActiveDay = activeDays > 0 ? totalTime / activeDays / 60 : 0;

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tổng thời gian" value={formatHours(totalTime)} />
        <StatCard label="Ngày hoạt động (30d)" value={`${activeDays}/30`} />
        <StatCard label="TB phút/ngày active" value={`${avgPerActiveDay.toFixed(0)}m`} />
        <StatCard label="Tổng phiên" value={String(aiCount + expertCount)} />
      </div>

      {/* Time per skill */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Thời gian luyện theo kỹ năng</h3>
        <div className="space-y-3">
          {SKILLS.map(({ key, label, icon: Icon }) => {
            const sec = timePerSkill[key] ?? 0;
            const pct = totalTime > 0 ? (sec / totalTime) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-28 text-sm text-gray-700">
                  <Icon className="h-4 w-4 text-gray-500" />
                  {label}
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 w-20 text-right">{formatHours(sec)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Count per skill */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Số bài theo kỹ năng</h3>
        <div className="grid grid-cols-4 gap-4 items-end h-40">
          {SKILLS.map(({ key, label, icon: Icon }) => {
            const c = countPerSkill[key] ?? 0;
            const h = (c / maxCount) * 100;
            return (
              <div key={key} className="flex flex-col items-center gap-2 h-full">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full bg-emerald-500 rounded-t transition-all"
                    style={{ height: `${h}%`, minHeight: c > 0 ? '4px' : '0' }}
                    title={`${c} bài`}
                  />
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
                <div className="text-sm font-bold text-gray-800">{c}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI vs Expert */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Nguồn chấm</h3>
          {totalSource === 0 ? (
            <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden">
                <div className="bg-gray-400" style={{ width: `${(aiCount / totalSource) * 100}%` }} />
                <div className="bg-emerald-500" style={{ width: `${(expertCount / totalSource) * 100}%` }} />
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-gray-700">
                    <Bot className="h-3.5 w-3.5 text-gray-500" /> AI / Practice
                  </span>
                  <span className="font-semibold text-gray-800">{aiCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-gray-700">
                    <GraduationCap className="h-3.5 w-3.5 text-emerald-600" /> Expert
                  </span>
                  <span className="font-semibold text-emerald-600">{expertCount}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Heatmap 30d */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Hoạt động 30 ngày qua</h3>
          <div className="grid grid-cols-10 gap-1">
            {heatmap.map((d, i) => {
              const bg = d.count === 0
                ? 'bg-gray-100'
                : d.intensity < 0.33
                  ? 'bg-emerald-200'
                  : d.intensity < 0.66
                    ? 'bg-emerald-400'
                    : 'bg-emerald-600';
              return <div key={i} className={`h-5 rounded-sm ${bg}`} title={`${d.count} bài`} />;
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
            <span>30 ngày trước</span>
            <span>Hôm nay</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-gray-800 mt-1">{value}</div>
    </div>
  );
}
