'use client';

import React, { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useAttemptHistory } from '@/hooks/use-attempt-history';
import { Flame, Trophy, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    let checkDate = new Date(today);
    checkDate.setHours(0, 0, 0, 0);
    
    // If no activity today, check if there was activity yesterday to continue streak
    if (!countsByDate.has(toISODate(checkDate))) {
      checkDate = subDays(checkDate, 1);
    }
    
    while (countsByDate.has(toISODate(checkDate))) {
      streak++;
      checkDate = subDays(checkDate, 1);
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
    return (
      <div className="bg-card rounded-3xl p-8 border border-border shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md mb-8"></div>
        <div className="h-40 bg-muted/50 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        .react-calendar-heatmap text {
          font-size: 8px;
          fill: oklch(0.5 0.01 160);
          font-weight: 600;
        }
        .react-calendar-heatmap .color-empty {
          fill: oklch(0.98 0.005 160);
          rx: 4;
          ry: 4;
        }
        /* OKLCH Scale for Teal (Primary Brand Hue) */
        .react-calendar-heatmap .color-scale-1 { fill: oklch(0.93 0.04 160); rx: 4; ry: 4; }
        .react-calendar-heatmap .color-scale-2 { fill: oklch(0.82 0.08 160); rx: 4; ry: 4; }
        .react-calendar-heatmap .color-scale-3 { fill: oklch(0.70 0.12 160); rx: 4; ry: 4; }
        .react-calendar-heatmap .color-scale-4 { fill: oklch(0.55 0.20 160); rx: 4; ry: 4; }
        
        .react-calendar-heatmap rect:hover {
          stroke: oklch(0.55 0.20 160);
          stroke-width: 2px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(1.1);
          transform-origin: center;
        }
        .react-calendar-heatmap rect {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}} />

      <TooltipProvider>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Heatmap Card */}
          <div className="lg:col-span-3 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                  Hành trình nỗ lực
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  Bạn đã hoàn thành <span className="text-primary font-bold">{totalThisYear}</span> bài luyện tập trong năm {year}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-secondary/50 px-3 py-1.5 rounded-full">
                <span>Ít</span>
                <div className="flex gap-1">
                  <span className="w-3 h-3 rounded-sm bg-muted"></span>
                  <span className="w-3 h-3 rounded-sm bg-[oklch(0.93_0.04_160)]"></span>
                  <span className="w-3 h-3 rounded-sm bg-[oklch(0.82_0.08_160)]"></span>
                  <span className="w-3 h-3 rounded-sm bg-[oklch(0.70_0.12_160)]"></span>
                  <span className="w-3 h-3 rounded-sm bg-[oklch(0.55_0.20_160)]"></span>
                </div>
                <span>Nhiều</span>
              </div>
            </div>
            
            <div className="overflow-x-auto pb-2 scrollbar-none">
              <div className="min-w-[700px]">
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
                  transformDayElement={(element, value: any) => {
                    const d = value?.date ? new Date(value.date) : null;
                    const ds = d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '';
                    const count = value?.count || 0;

                    return (
                      <Tooltip key={value?.date || Math.random()}>
                        <TooltipTrigger asChild>
                          {element}
                        </TooltipTrigger>
                        <TooltipContent className="bg-foreground text-background font-bold px-3 py-2 rounded-xl shadow-xl border-none">
                          <p>{count} bài luyện tập</p>
                          <p className="text-[10px] opacity-70">{ds}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stats Column */}
          <div className="flex flex-col gap-6">
            {/* Streak Card */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex-1 flex flex-col justify-center items-center text-center group transition-all duration-300 hover:border-primary/20 hover:shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Chuỗi học tập</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-foreground">{currentStreak}</span>
                <span className="text-sm font-bold text-muted-foreground">ngày</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Bứt phá giới hạn!</p>
            </div>

            {/* Weekly Total Card */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex-1 flex flex-col justify-center items-center text-center group transition-all duration-300 hover:border-primary/20 hover:shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <Trophy className="w-6 h-6 text-primary fill-primary/20" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Tuần này</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-foreground">{totalThisWeek}</span>
                <span className="text-sm font-bold text-muted-foreground">bài</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Tiến gần hơn tới mục tiêu</p>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
