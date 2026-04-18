'use client';

import { Calendar, FileText, UserCheck } from 'lucide-react';
import type { NormalisedData } from './result-normalise';
import { bandTextColor, bandBarGradient } from './result-color-helpers';

interface Props {
  data: NormalisedData;
  taskType: 1 | 2;
  wordCount: number;
  submittedAt: string;
  examinerLabel?: string;
}

// Hero gradient + 4 criterion bars (Phương án A)
export function ResultHero({ data, taskType, wordCount, submittedAt, examinerLabel }: Props) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_28px_-12px_rgba(15,23,42,0.08)]">
      {/* Gradient hero */}
      <div className="relative p-7 md:p-8 bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-400 text-white">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right,white,transparent 60%)' }}
        />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
          {/* Overall band ring */}
          <div className="relative w-32 h-32 rounded-full shrink-0 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.35)] grid place-items-center"
               style={{ background: `conic-gradient(#14B8A6 0 ${Math.min(100, (data.overall / 9) * 100)}%, rgba(255,255,255,0.2) 0)` }}>
            <div className="w-[108px] h-[108px] rounded-full bg-white grid place-items-center">
              <div className="text-center leading-none">
                <div className="text-[40px] font-black text-teal-700 tracking-tight">{data.overall.toFixed(1)}</div>
                <div className="text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] mt-1">Overall Band</div>
              </div>
            </div>
          </div>
          {/* Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-black bg-white/20 border border-white/30 text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                Writing · Task {taskType}
              </span>
              <span className="text-[10px] font-black bg-emerald-400/30 border border-emerald-200/60 text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                Đã chấm điểm
              </span>
            </div>
            <h1 className="text-[20px] md:text-[24px] font-black leading-tight tracking-tight">
              Kết quả bài viết của bạn
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-white/85 mt-2 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {submittedAt}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> {wordCount} từ
              </span>
              {examinerLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" /> {examinerLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 criterion bars */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {data.criteria.map((c) => (
          <div key={c.key} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{c.label}</span>
              <span className={`text-[18px] font-black ${bandTextColor(c.band)} tabular-nums`}>{c.band.toFixed(1)}</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.min(100, (c.band / 9) * 100)}%`, background: bandBarGradient(c.band) }}
              />
            </div>
            {c.justification && (
              <p className="text-[11.5px] text-slate-500 mt-2 font-medium leading-snug line-clamp-2">
                {c.justification}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
