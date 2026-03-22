'use client';

import { useMemo } from 'react';
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

const VI_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

interface DayStats {
  dateStr: string;
  label: string;
  skills: Record<SkillKey, number>;
  totalMinutes: number;
}

function getWeekDates(): { dateStr: string; label: string }[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { dateStr, label: VI_DAYS[i] };
  });
}

function buildDayStats(attempts: AttemptHistory[], weekDates: ReturnType<typeof getWeekDates>): DayStats[] {
  const byDate = new Map<string, AttemptHistory[]>();
  attempts.forEach((a) => {
    const dateStr = a.submittedAt?.slice(0, 10);
    if (!dateStr) return;
    const list = byDate.get(dateStr) ?? [];
    list.push(a);
    byDate.set(dateStr, list);
  });

  return weekDates.map(({ dateStr, label }) => {
    const acts = byDate.get(dateStr) ?? [];
    const skills: Record<SkillKey, number> = { reading: 0, listening: 0, writing: 0, speaking: 0 };
    let totalMinutes = 0;
    acts.forEach((a) => {
      const sk = a.skill?.toLowerCase() as SkillKey;
      if (sk && sk in skills) skills[sk]++;
      totalMinutes += Math.round(a.elapsedSeconds / 60);
    });
    return { dateStr, label, skills, totalMinutes };
  });
}

function formatMinutes(m: number): string {
  if (m === 0) return '0m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h${rem}m` : `${h}h`;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function WeeklyStats() {
  const { attempts } = useAttemptHistory();
  const weekDates = useMemo(() => getWeekDates(), []);
  const todayStr = useMemo(() => getTodayStr(), []);

  const dayStats = useMemo(() => buildDayStats(attempts, weekDates), [attempts, weekDates]);

  const totals = useMemo(() => {
    const skills: Record<SkillKey, number> = { reading: 0, listening: 0, writing: 0, speaking: 0 };
    let totalMinutes = 0;
    dayStats.forEach((d) => {
      SKILLS.forEach((s) => { skills[s] += d.skills[s]; });
      totalMinutes += d.totalMinutes;
    });
    return { skills, totalMinutes };
  }, [dayStats]);

  return (
    <div className="bg-warm-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-800">Thống kê số bài đã làm trong tuần</h3>
        <p className="text-xs text-gray-400 mt-0.5">Tuần hiện tại (Thứ 2 – Chủ nhật)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 pr-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Ngày</th>
              {SKILLS.map((s) => (
                <th key={s} className="text-center py-2 px-2 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  {SKILL_LABELS[s]}
                </th>
              ))}
              <th className="text-center py-2 pl-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {dayStats.map((day) => {
              const isToday = day.dateStr === todayStr;
              return (
                <tr key={day.dateStr} className={`border-b border-gray-50 ${isToday ? 'bg-orange-50/50' : 'hover:bg-gray-50/60'}`}>
                  <td className={`py-2 pr-3 text-xs font-medium whitespace-nowrap ${isToday ? 'text-orange-600' : 'text-gray-600'}`}>
                    {day.label}
                    {isToday && <span className="ml-1 text-orange-400 text-[10px]">(hôm nay)</span>}
                  </td>
                  {SKILLS.map((skill) => (
                    <td key={skill} className="py-2 px-2 text-center">
                      {day.skills[skill] > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          {day.skills[skill]}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                  ))}
                  <td className="py-2 pl-2 text-center text-xs text-gray-500 whitespace-nowrap">
                    {day.totalMinutes > 0 ? (
                      <span className="font-medium text-gray-700">{formatMinutes(day.totalMinutes)}</span>
                    ) : (
                      <span className="text-gray-300">0m</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50/60">
              <td className="py-2 pr-3 text-xs font-bold text-gray-700">Tổng cộng</td>
              {SKILLS.map((skill) => (
                <td key={skill} className="py-2 px-2 text-center">
                  {totals.skills[skill] > 0 ? (
                    <span className="text-xs font-bold text-green-700">{totals.skills[skill]}</span>
                  ) : (
                    <span className="text-gray-300 text-xs">-</span>
                  )}
                </td>
              ))}
              <td className="py-2 pl-2 text-center text-xs font-bold text-gray-700 whitespace-nowrap">
                {formatMinutes(totals.totalMinutes)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
