'use client';

import { useState, useMemo } from 'react';
import { useUserStore } from '@/store/user-store';
import { getCalendarData } from '@/lib/calendar-utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const VI_WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function getMonthGrid(year: number, month: number) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday=0, ..., Sunday=6
  let startDow = firstDay.getDay(); // 0=Sun..6=Sat
  startDow = startDow === 0 ? 6 : startDow - 1; // convert to Mon=0

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

  // Pad to full weeks
  while (days.length % 7 !== 0) days.push(null);

  // Split into weeks
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

const VI_MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function ActivityCalendar() {
  const activities = useUserStore((s) => s.activities);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const calendarData = useMemo(() => getCalendarData(activities), [activities]);
  const activitySet = useMemo(() => new Set(calendarData.map((d) => d.date)), [calendarData]);

  const weeks = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedWeek(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedWeek(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-800">
          Biểu đồ &quot;chăm chỉ&quot; của bạn
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
            {VI_MONTHS[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Bấm vào ngày/tuần để xem thống kê chi tiết số bài đã làm
      </p>

      {/* Weekday Labels */}
      <div className="grid grid-cols-8 gap-1 mb-1">
        <div className="text-xs text-gray-400 text-center" />
        {VI_WEEKDAYS.map((d) => (
          <div key={d} className="text-xs font-medium text-gray-400 text-center">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-8 gap-1 items-center">
            {/* Week label */}
            <button
              onClick={() => setSelectedWeek(selectedWeek === wi ? null : wi)}
              className={`text-xs rounded-md py-1 font-medium transition-colors ${
                selectedWeek === wi
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              T{wi + 1}
            </button>
            {/* Day cells */}
            {week.map((day, di) => {
              if (day === null) {
                return <div key={di} />;
              }
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isToday = dateStr === todayStr;
              const hasActivity = activitySet.has(dateStr);
              const isHighlighted = selectedWeek === wi;

              return (
                <div
                  key={di}
                  title={dateStr}
                  className={`flex flex-col items-center justify-center rounded-lg py-1 transition-colors cursor-default ${
                    isHighlighted ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? hasActivity
                          ? 'bg-green-500 text-white'
                          : 'bg-orange-400 text-white'
                        : 'text-gray-600'
                    }`}
                  >
                    {day}
                  </span>
                  {hasActivity && !isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-0.5" />
                  )}
                  {!hasActivity && !isToday && (
                    <span className="w-1.5 h-1.5 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500">Có nộp bài</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          <span className="text-xs text-gray-500">Hôm nay</span>
        </div>
      </div>
    </div>
  );
}
