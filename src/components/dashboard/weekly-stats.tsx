'use client';

import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import type { AttemptHistory } from '@/lib/practice-api';
import type { SkillKey } from '@/types';
import { useAttemptHistory } from '@/hooks/use-attempt-history';

const SKILLS: SkillKey[] = ['reading', 'listening', 'writing', 'speaking'];

const SKILL_LABELS: Record<SkillKey, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
};

// Warm playful tone per skill — matches target-scores theme
const SKILL_STYLE: Record<SkillKey, { text: string; track: string; fill: string }> = {
  reading:   { text: 'text-gray-700',    track: 'bg-gray-100',    fill: 'bg-gray-500' },
  listening: { text: 'text-gray-700',  track: 'bg-gray-100',  fill: 'bg-gray-500' },
  writing:   { text: 'text-emerald-700', track: 'bg-emerald-100', fill: 'bg-emerald-500' },
  speaking:  { text: 'text-pink-700',    track: 'bg-gray-100',    fill: 'bg-gray-500' },
};

function getWeekRange(): { start: Date; end: Date; label: string } {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return { start: monday, end: sunday, label: `${fmt(monday)} – ${fmt(sunday)}` };
}

// Aggregate this week's attempts per skill + minutes
function computeWeeklyTotals(attempts: AttemptHistory[]) {
  const { start, end, label } = getWeekRange();
  const skills: Record<SkillKey, number> = { reading: 0, listening: 0, writing: 0, speaking: 0 };
  let totalMinutes = 0;

  attempts.forEach((a) => {
    if (!a.submittedAt) return;
    const t = new Date(a.submittedAt);
    if (t < start || t > end) return;
    const sk = a.skill?.toLowerCase() as SkillKey;
    if (sk && sk in skills) skills[sk]++;
    totalMinutes += Math.round(a.elapsedSeconds / 60);
  });

  const total = Object.values(skills).reduce((a, b) => a + b, 0);
  return { skills, totalMinutes, total, label };
}

function formatMinutes(m: number): string {
  if (m === 0) return '0m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h${rem}m` : `${h}h`;
}

export function WeeklyStats() {
  const { attempts } = useAttemptHistory();
  const { skills, totalMinutes, total, label } = useMemo(() => computeWeeklyTotals(attempts), [attempts]);

  // Scale bars against the max skill count so one-off weeks still show meaningful progress
  const maxSkillCount = Math.max(1, ...SKILLS.map((s) => skills[s]));

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-3 sm:p-6 h-full flex flex-col overflow-hidden min-w-0">
      <div className="flex items-start justify-between mb-3 sm:mb-5 gap-2 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl sm:rounded-2xl bg-gray-100 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900">Tuần này</h3>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">Phân bổ bài luyện theo kỹ năng</p>
          </div>
        </div>
        <span className="text-[10px] sm:text-xs font-bold bg-emerald-50 text-emerald-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap shrink-0">{label}</span>
      </div>

      <div className="space-y-2.5 sm:space-y-4 flex-1">
        {SKILLS.map((s) => {
          const count = skills[s];
          const style = SKILL_STYLE[s];
          const pct = (count / maxSkillCount) * 100;
          return (
            <div key={s}>
              <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-1.5">
                <span className={`font-bold ${style.text}`}>{SKILL_LABELS[s]}</span>
                <span className="font-extrabold text-gray-900">{count} <span className="font-medium text-gray-500">bài</span></span>
              </div>
              <div className={`h-2 sm:h-2.5 ${style.track} rounded-full overflow-hidden`}>
                <div
                  className={`h-full ${style.fill} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 sm:mt-6 pt-3 sm:pt-5 border-t border-dashed border-gray-200 grid grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-emerald-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center min-w-0">
          <div className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wide truncate">Tổng bài</div>
          <div className="text-lg sm:text-2xl font-extrabold text-gray-900 mt-0.5 truncate">{total}</div>
        </div>
        <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center min-w-0">
          <div className="text-[10px] sm:text-xs font-bold text-pink-600 uppercase tracking-wide truncate">Thời gian</div>
          <div className="text-lg sm:text-2xl font-extrabold text-gray-900 mt-0.5 truncate">{formatMinutes(totalMinutes)}</div>
        </div>
      </div>
    </div>
  );
}
