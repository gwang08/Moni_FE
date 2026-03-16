'use client';

import Link from 'next/link';
import { X, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  title: string;
  questionCount: number;
  elapsedTime: string;
  submitted: boolean;
  answeredCount: number;
  totalQuestions: number;
  isCountingDown?: boolean;
  remainingSeconds?: number;
  onSubmit: () => void;
  onExit: () => void;
}

export function ListeningPracticeHeader({
  title,
  elapsedTime,
  submitted,
  isCountingDown,
  remainingSeconds,
  onExit,
}: Props) {
  const isUrgent = isCountingDown && (remainingSeconds ?? 999) < 60;
  return (
    <div className="shrink-0 flex items-center justify-between px-5 py-2 bg-white/60 backdrop-blur-sm border-b border-gray-100">
      {/* Left: close */}
      {submitted ? (
        <Link href="/practice?skill=listening">
          <button className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all hover:scale-105">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </Link>
      ) : (
        <button
          onClick={onExit}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all hover:scale-105"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      )}

      {/* Center: timer */}
      <div className="flex items-center gap-2">
        {submitted && (
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold flex items-center gap-1 border border-emerald-200/60">
            <CheckCircle2 className="h-3 w-3" />
            Đã hoàn thành
          </span>
        )}
        <div className={`flex items-center gap-1.5 text-white px-4 py-1.5 rounded-full shadow-sm ${isUrgent ? 'bg-red-500 animate-pulse' : isCountingDown ? 'bg-orange-500' : 'bg-emerald-500'}`}>
          <Clock className="h-3.5 w-3.5" />
          <span className="text-sm font-bold font-mono tabular-nums">{elapsedTime}</span>
          {isCountingDown && !submitted && <span className="text-[10px]">⏱</span>}
        </div>
      </div>

      {/* Right: title */}
      <span className="text-sm font-medium text-gray-500 truncate max-w-[200px]">{title}</span>
    </div>
  );
}
