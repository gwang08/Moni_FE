'use client';

import React, { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useAttemptHistory } from '@/hooks/use-attempt-history';
import { Flame, Trophy } from 'lucide-react';

const VI_MONTHS: [string, string, string, string, string, string, string, string, string, string, string, string] = [
  'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'
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

export function StudyProgress() {
  const { attempts, loading } = useAttemptHistory();

  const { heatMapValues, currentStreak, totalThisYear, totalThisWeek, year } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();

    const countsByDate = new Map<string, number>();
    
    // For this week
    const weekStart = getStartOfWeek(today); 
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    weekStart.setHours(0, 0, 0, 0);

    let totalThisWeek = 0;
    let totalThisYear = 0;

    attempts.forEach(a => {
      if (!a.submittedAt) return;
      
      const date = new Date(a.submittedAt);
      const dateStr = a.submittedAt.slice(0, 10);
      
      if (date.getFullYear() === currentYear) {
        countsByDate.set(dateStr, (countsByDate.get(dateStr) || 0) + 1);
        totalThisYear++;
      }
      
      if (date >= weekStart && date <= weekEnd) {
        totalThisWeek++;
      }
    });

    const values = Array.from(countsByDate.entries()).map(([date, count]) => ({
      date, count
    }));

    // Calculate streak
    let streak = 0;
    const todayStr = toISODate(today);
    const yesterdayStr = toISODate(subDays(today, 1));
    
    let currDateStr = countsByDate.has(todayStr) ? todayStr : yesterdayStr;
    
    if (countsByDate.has(currDateStr)) {
      let currDate = new Date(currDateStr);
      while (countsByDate.has(toISODate(currDate))) {
        streak++;
        currDate = subDays(currDate, 1);
      }
    }

    return { 
      heatMapValues: values, 
      currentStreak: streak, 
      totalThisYear, 
      totalThisWeek,
      year: currentYear
    };
  }, [attempts]);

  if (loading) {
    return <div className="h-64 animate-pulse bg-slate-100 rounded-3xl"></div>;
  }

  return (
    <div className="space-y-8 font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        .react-calendar-heatmap text {
          font-size: 8px;
          fill: #cbd5e1;
          font-weight: 500;
        }
        .react-calendar-heatmap .color-empty {
          fill: #f1f5f9;
          rx: 3;
          ry: 3;
        }
        .react-calendar-heatmap .color-scale-1 { fill: #e0e7ff; rx: 3; ry: 3; }
        .react-calendar-heatmap .color-scale-2 { fill: #c7d2fe; rx: 3; ry: 3; }
        .react-calendar-heatmap .color-scale-3 { fill: #818cf8; rx: 3; ry: 3; }
        .react-calendar-heatmap .color-scale-4 { fill: #4f46e5; rx: 3; ry: 3; }
        
        .react-calendar-heatmap rect:hover {
          stroke: #6366f1;
          stroke-width: 1.5px;
          transition: all 0.2s;
        }
        .react-calendar-heatmap rect {
          transition: all 0.2s;
        }
      `}} />

      {/* Header section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center border border-indigo-100 bg-white shadow-[0_2px_10px_-4px_rgba(79,70,229,0.1)] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-2 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span>
          study progress
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 leading-tight">
          Theo dõi hành trình – <br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Bứt phá mỗi ngày</span>
        </h2>
        <p className="text-sm text-slate-500 font-medium">Mỗi ô vuông nhỏ là một bước tiến trên con đường chinh phục IELTS của bạn</p>
      </div>
      
      {/* Cards section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Heatmap Card */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[1.5rem] p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                <div>
                   <h3 className="text-lg font-extrabold text-slate-800">Hoạt động học tập</h3>
                   <p className="text-sm text-slate-400 font-medium">{totalThisYear} bài luyện tập trong năm {year}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                    <span>Ít</span>
                    <div className="flex gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-[3px] bg-[#f1f5f9]"></span>
                        <span className="w-3.5 h-3.5 rounded-[3px] bg-[#e0e7ff]"></span>
                        <span className="w-3.5 h-3.5 rounded-[3px] bg-[#c7d2fe]"></span>
                        <span className="w-3.5 h-3.5 rounded-[3px] bg-[#818cf8]"></span>
                        <span className="w-3.5 h-3.5 rounded-[3px] bg-[#4f46e5]"></span>
                    </div>
                    <span>Nhiều</span>
                </div>
            </div>
            
            <div className="overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
                <div className="min-w-[700px]">
                    <CalendarHeatmap 
                        startDate={new Date(year - 1, 11, 31)} 
                        endDate={new Date(year, 11, 31)} 
                        values={heatMapValues} 
                        classForValue={(value) => {
                            if (!value || value.count === 0) return 'color-empty';
                            if (value.count === 1) return `color-scale-1`;
                            if (value.count === 2) return `color-scale-2`;
                            if (value.count === 3) return `color-scale-3`;
                            return `color-scale-4`;
                        }}
                        showWeekdayLabels={true}
                        weekdayLabels={['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']}
                        monthLabels={VI_MONTHS}
                        tooltipDataAttrs={(value: any) => {
                            if (!value || !value.date) return { 'data-tooltip-id': 'heatmap-tooltip', 'data-tooltip-content': '' } as any;
                            const d = new Date(value.date);
                            const ds = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
                            return {
                                'data-tooltip': `${value.count} bài luyện tập - ${ds}`,
                                title: `${value.count} bài luyện tập - ${ds}`
                            } as any;
                        }}
                    />
                </div>
            </div>
        </div>

        {/* Side Cards */}
        <div className="space-y-6 flex flex-col justify-between">
            {/* Streak */}
            <div className="bg-gradient-to-br from-[#F8F9FF] to-white border border-indigo-50 rounded-[1.5rem] p-6 sm:p-7 shadow-[0_4px_25px_-5px_rgba(79,70,229,0.06)] flex-1 flex flex-col justify-center relative overflow-hidden transition-all duration-300 hover:shadow-[0_4px_25px_-5px_rgba(79,70,229,0.12)] hover:-translate-y-1">
                <div className="w-10 h-10 rounded-full bg-white border border-indigo-100 shadow-sm flex items-center justify-center mb-4 text-indigo-500 z-10 relative">
                    <Flame className="w-5 h-5 text-indigo-500" />
                </div>
                <h4 className="text-xs font-bold text-indigo-400 tracking-widest uppercase mb-1 z-10 relative">Chuỗi học tập</h4>
                <div className="flex items-baseline gap-1.5 mb-1 z-10 relative">
                    <span className="text-[2.5rem] leading-none font-extrabold text-slate-800">{currentStreak}</span>
                    <span className="text-sm font-semibold text-slate-600">ngày</span>
                </div>
                <p className="text-xs text-slate-400 font-medium z-10 relative">Tiếp tục phát huy nhé!</p>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-br from-[#FFF9F5] to-white border border-orange-50 rounded-[1.5rem] p-6 sm:p-7 shadow-[0_4px_25px_-5px_rgba(249,115,22,0.06)] flex-1 flex flex-col justify-center relative overflow-hidden transition-all duration-300 hover:shadow-[0_4px_25px_-5px_rgba(249,115,22,0.12)] hover:-translate-y-1">
                <div className="w-10 h-10 rounded-full bg-white border border-orange-100 shadow-sm flex items-center justify-center mb-4 z-10 relative">
                    <Trophy className="w-5 h-5 text-orange-500" />
                </div>
                <h4 className="text-xs font-bold text-orange-400 tracking-widest uppercase mb-1 z-10 relative">Tổng luyện tập</h4>
                <div className="flex items-baseline gap-1.5 mb-1 z-10 relative">
                    <span className="text-[2.5rem] leading-none font-extrabold text-slate-800">{totalThisYear}</span>
                    <span className="text-sm font-semibold text-slate-600">bài</span>
                </div>
                <p className="text-xs text-slate-400 font-medium z-10 relative">+{totalThisWeek} bài tuần này</p>
            </div>
        </div>

      </div>
    </div>
  );
}
