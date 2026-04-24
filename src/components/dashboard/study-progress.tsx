'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useAttemptHistory } from '@/hooks/use-attempt-history';
import { Flame, Trophy } from 'lucide-react';

const VI_MONTHS: [string, string, string, string, string, string, string, string, string, string, string, string] = [
  'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12',
];

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function subDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

interface HoverState {
  x: number;
  y: number;
  placement: 'top' | 'bottom';
  date: string;
  count: number;
}

const TOOLTIP_GAP = 10;
const TOOLTIP_ESTIMATED_HEIGHT = 56;

export function StudyProgress() {
  const { attempts, loading } = useAttemptHistory();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  const { heatMapValues, currentStreak, totalThisYear, totalThisWeek, year } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();

    const countsByDate = new Map<string, number>();
    const weekStart = getStartOfWeek(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    weekStart.setHours(0, 0, 0, 0);

    let totalThisWeek = 0;
    let totalThisYear = 0;

    attempts.forEach((a) => {
      if (!a.submittedAt) return;
      const date = new Date(a.submittedAt);
      const dateStr = a.submittedAt.slice(0, 10);
      if (date.getFullYear() === currentYear) {
        countsByDate.set(dateStr, (countsByDate.get(dateStr) || 0) + 1);
        totalThisYear++;
      }
      if (date >= weekStart && date <= weekEnd) totalThisWeek++;
    });

    const values = Array.from(countsByDate.entries()).map(([date, count]) => ({ date, count }));

    let streak = 0;
    let checkDate = new Date(today);
    checkDate.setHours(0, 0, 0, 0);
    if (!countsByDate.has(toISODate(checkDate))) checkDate = subDays(checkDate, 1);
    while (countsByDate.has(toISODate(checkDate))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }

    return { heatMapValues: values, currentStreak: streak, totalThisYear, totalThisWeek, year: currentYear };
  }, [attempts]);

  // Single tooltip state driven by rect hover events — no scale transform so no jitter.
  // Flip placement to 'bottom' when the cell is too close to top of the card to render above.
  const handleCellEnter = useCallback((e: React.MouseEvent, date: string, count: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cellRect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const xInContainer = cellRect.left - containerRect.left + cellRect.width / 2;
    const topInContainer = cellRect.top - containerRect.top;
    const bottomInContainer = topInContainer + cellRect.height;
    const spaceAbove = topInContainer;
    const placement: 'top' | 'bottom' = spaceAbove < TOOLTIP_ESTIMATED_HEIGHT + TOOLTIP_GAP ? 'bottom' : 'top';
    setHover({
      x: xInContainer,
      y: placement === 'top' ? topInContainer : bottomInContainer,
      placement,
      date,
      count,
    });
  }, []);

  const handleCellLeave = useCallback(() => setHover(null), []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm animate-pulse h-full">
        <div className="h-6 w-48 bg-gray-200 rounded-md mb-6"></div>
        <div className="h-40 bg-gray-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm h-full">
      <style dangerouslySetInnerHTML={{__html: `
        .react-calendar-heatmap text { font-size: 8px; fill: #94a3b8; font-weight: 600; }
        .react-calendar-heatmap .color-empty { fill: #f1f5f9; rx: 3; ry: 3; }
        .react-calendar-heatmap .color-scale-1 { fill: #fed7aa; rx: 3; ry: 3; }
        .react-calendar-heatmap .color-scale-2 { fill: #fb923c; rx: 3; ry: 3; }
        .react-calendar-heatmap .color-scale-3 { fill: #f97316; rx: 3; ry: 3; }
        .react-calendar-heatmap .color-scale-4 { fill: #c2410c; rx: 3; ry: 3; }
        .react-calendar-heatmap rect { cursor: pointer; }
        .react-calendar-heatmap rect:hover { stroke: #ea580c; stroke-width: 1.5px; }
      `}} />

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900">Hành trình nỗ lực</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Đã hoàn thành <span className="text-emerald-600 font-bold">{totalThisYear}</span> bài luyện trong năm {year}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
            <Flame className="w-4 h-4 text-emerald-500" fill="#fb923c" />
            <span className="text-xs font-bold text-emerald-700"><b className="text-base">{currentStreak}</b> ngày streak</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
            <Trophy className="w-4 h-4 text-gray-500" fill="#fbcfe8" />
            <span className="text-xs font-bold text-pink-700"><b className="text-base">{totalThisWeek}</b> bài tuần này</span>
          </div>
        </div>
      </div>

      {/* Heatmap + floating tooltip in same relative container so coords align */}
      <div ref={containerRef} className="relative overflow-x-auto pb-1">
        <div className="min-w-[720px]">
          <CalendarHeatmap
            startDate={new Date(year - 1, 11, 31)}
            endDate={new Date(year, 11, 31)}
            values={heatMapValues}
            classForValue={(value) => {
              if (!value || value.count === 0) return 'color-empty';
              if (value.count === 1) return 'color-scale-1';
              if (value.count === 2) return 'color-scale-2';
              if (value.count === 3) return 'color-scale-3';
              return 'color-scale-4';
            }}
            showWeekdayLabels={true}
            weekdayLabels={['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']}
            monthLabels={VI_MONTHS}
            transformDayElement={((element: any, value: any) => {
              const date = value?.date as string | undefined;
              const count = (value?.count as number | undefined) ?? 0;
              if (!date) return element;
              return React.cloneElement(element, {
                onMouseEnter: (e: React.MouseEvent) => handleCellEnter(e, date, count),
                onMouseLeave: handleCellLeave,
              });
            }) as any}
          />
        </div>

        {hover && (
          <div
            className="pointer-events-none absolute z-20 bg-gray-900 text-white text-xs rounded-lg shadow-xl px-3 py-2 font-medium whitespace-nowrap"
            style={{
              left: hover.x,
              top: hover.placement === 'top' ? hover.y - TOOLTIP_GAP : hover.y + TOOLTIP_GAP,
              transform: hover.placement === 'top'
                ? 'translate(-50%, -100%)'
                : 'translate(-50%, 0)',
            }}
          >
            <div className="font-bold">{hover.count} bài luyện tập</div>
            <div className="text-[10px] opacity-70 mt-0.5">{formatDayDate(hover.date)}</div>
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 ${
                hover.placement === 'top' ? '-bottom-1' : '-top-1'
              }`}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
        <span>Ít</span>
        <div className="flex gap-1">
          <span className="w-3 h-3 rounded-sm bg-slate-100"></span>
          <span className="w-3 h-3 rounded-sm bg-emerald-200"></span>
          <span className="w-3 h-3 rounded-sm bg-emerald-400"></span>
          <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
          <span className="w-3 h-3 rounded-sm bg-emerald-700"></span>
        </div>
        <span>Nhiều</span>
      </div>
    </div>
  );
}
