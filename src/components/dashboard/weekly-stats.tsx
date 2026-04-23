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
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Thống kê bài làm</h3>
        <p className="text-xs text-muted-foreground mt-1">Tuần hiện tại (Thứ 2 – Chủ nhật)</p>
      </div>

      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3">
        {dayStats.map((day) => {
          const isToday = day.dateStr === todayStr;
          const hasActivity = day.totalMinutes > 0;
          if (!hasActivity && !isToday) return null;

          return (
            <div key={day.dateStr} className={`p-4 rounded-xl border transition-all ${isToday ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-secondary/20 border-border'}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{day.label}</span>
                  {isToday && <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Hôm nay</span>}
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-background/50 px-2 py-1 rounded-lg">{formatMinutes(day.totalMinutes)}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {SKILLS.map((s) => day.skills[s] > 0 && (
                  <div key={s} className="bg-card px-2.5 py-1 rounded-lg text-[10px] font-bold border border-border flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{SKILL_LABELS[s]}:</span>
                    <span className="text-foreground">{day.skills[s]}</span>
                  </div>
                ))}
                {!hasActivity && <span className="text-[10px] italic text-muted-foreground">Chưa có hoạt động</span>}
              </div>
            </div>
          );
        })}
        <div className="pt-2 mt-4 border-t border-dashed border-border">
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-bold text-foreground">Tổng cộng tuần</span>
            <span className="text-sm font-extrabold text-primary">{formatMinutes(totals.totalMinutes)}</span>
          </div>
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto mt-4">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left py-2 px-3 text-[11px] font-bold uppercase tracking-[0.1em] whitespace-nowrap">Ngày</th>
              {SKILLS.map((s) => (
                <th key={s} className="text-center py-2 px-2 text-[11px] font-bold uppercase tracking-[0.1em] whitespace-nowrap">
                  {SKILL_LABELS[s]}
                </th>
              ))}
              <th className="text-center py-2 pl-2 text-[11px] font-bold uppercase tracking-[0.1em] whitespace-nowrap">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {dayStats.map((day) => {
              const isToday = day.dateStr === todayStr;
              return (
                <tr key={day.dateStr} className={`group transition-all ${isToday ? 'bg-[#F2F9F5]' : 'hover:bg-gray-50'}`}>
                  <td className={`py-4 px-3 text-sm font-bold rounded-l-xl ${isToday ? 'text-[#00A859]' : 'text-gray-800'}`}>
                    {day.label === 'CN' ? (
                      <span>CN {isToday && <span className="ml-1 text-[10px] opacity-80">★</span>}</span>
                    ) : (
                      <>
                        <span className="block">Thứ</span>
                        <span className="block">
                          {day.label.replace('Thứ ', '')}
                          {isToday && <span className="ml-1 text-[10px] opacity-80">★</span>}
                        </span>
                      </>
                    )}
                  </td>
                  {SKILLS.map((skill) => (
                    <td key={skill} className="py-4 px-2 text-center">
                      {day.skills[skill] > 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#E5F5EC] text-[#00A859] text-xs font-bold">
                          {day.skills[skill]}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm font-medium">-</span>
                      )}
                    </td>
                  ))}
                  <td className={`py-4 px-3 text-center text-sm font-bold rounded-r-xl ${isToday ? 'text-[#00A859]' : 'text-gray-400'}`}>
                    {day.totalMinutes > 0 ? (
                      <span className="text-gray-700">{formatMinutes(day.totalMinutes)}</span>
                    ) : (
                      <span className="opacity-30">0m</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={7} className="pt-6 pb-2">
                <div className="flex justify-between items-center bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                   <span className="text-sm font-bold text-gray-800">Tổng cộng tuần này</span>
                   <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Hoàn thành:</span>
                        <span className="text-sm font-bold text-[#00A859]">
                          {Object.values(totals.skills).reduce((a, b) => a + b, 0)} bài
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Thời gian:</span>
                        <span className="text-sm font-extrabold text-gray-800">{formatMinutes(totals.totalMinutes)}</span>
                      </div>
                   </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
