'use client';

import { useMemo } from 'react';
import { useUserStore } from '@/store/user-store';
import type { Activity, SkillKey } from '@/types';

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
  // Monday of this week
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { dateStr, label: VI_DAYS[i] };
  });
}

function buildDayStats(activities: Activity[], weekDates: ReturnType<typeof getWeekDates>): DayStats[] {
  const actsByDate = new Map<string, Activity[]>();
  activities.forEach((a) => {
    const list = actsByDate.get(a.date) ?? [];
    list.push(a);
    actsByDate.set(a.date, list);
  });

  return weekDates.map(({ dateStr, label }) => {
    const acts = actsByDate.get(dateStr) ?? [];
    const skills = { reading: 0, listening: 0, writing: 0, speaking: 0 } as Record<SkillKey, number>;
    let totalMinutes = 0;
    acts.forEach((a) => {
      skills[a.skill]++;
      totalMinutes += a.duration;
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
  const activities = useUserStore((s) => s.activities);
  const weekDates = useMemo(() => getWeekDates(), []);
  const dayStats = useMemo(() => buildDayStats(activities, weekDates), [activities, weekDates]);
  const todayStr = useMemo(() => getTodayStr(), []);

  const totals = useMemo(() => {
    const skills = { reading: 0, listening: 0, writing: 0, speaking: 0 } as Record<SkillKey, number>;
    let totalMinutes = 0;
    dayStats.forEach((d) => {
      SKILLS.forEach((s) => { skills[s] += d.skills[s]; });
      totalMinutes += d.totalMinutes;
    });
    return { skills, totalMinutes };
  }, [dayStats]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
