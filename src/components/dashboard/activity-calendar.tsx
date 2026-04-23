'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAttemptHistory } from '@/hooks/use-attempt-history';

const VI_WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);

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
  const { attempts } = useAttemptHistory();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const activityDates = useMemo(() => {
    const dates = new Set<string>();
    attempts.forEach((a) => {
      const dateStr = a.submittedAt?.slice(0, 10);
      if (dateStr) dates.add(dateStr);
    });
    return dates;
  }, [attempts]);

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-800 leading-tight w-1/2">
          Biểu đồ &quot;chăm chỉ&quot; của bạn
        </h3>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center justify-center min-w-[80px]">
            <span className="text-base font-semibold text-gray-800">
              {VI_MONTHS[viewMonth]}
            </span>
            <span className="text-base font-semibold text-gray-800">
              {viewYear}
            </span>
          </div>
          <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Các ngày có chấm xanh là ngày bạn đã luyện tập
      </p>

      {/* Weekday Labels */}
      <div className="grid grid-cols-8 gap-2 mb-3">
        <div className="text-sm text-gray-400 text-center" />
        {VI_WEEKDAYS.map((d) => (
          <div key={d} className="text-sm font-medium text-gray-400 text-center">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-8 gap-2 items-center">
            <button
              onClick={() => setSelectedWeek(selectedWeek === wi ? null : wi)}
              className={`text-sm rounded-md py-1 font-medium transition-colors ${
                selectedWeek === wi
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
            >
              T{wi + 1}
            </button>
            {week.map((day, di) => {
              if (day === null) {
                return <div key={di} />;
              }
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isToday = dateStr === todayStr;
              const hasActivity = activityDates.has(dateStr);
              const isHighlighted = selectedWeek === wi;

              return (
                <div
                  key={di}
                  title={dateStr}
                  className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors cursor-default ${
                    isHighlighted ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-[#F97316] text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </span>
                  <div className="h-1.5 mt-1 flex justify-center w-full">
                    {hasActivity && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00A859]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-5 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#00A859]" />
          <span className="text-sm text-gray-500 font-medium">Có nộp bài</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#F97316]" />
          <span className="text-sm text-gray-500 font-medium">Hôm nay</span>
        </div>
      </div>
    </div>
  );
}
