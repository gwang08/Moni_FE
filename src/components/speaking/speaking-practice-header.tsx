'use client';

import { ArrowLeft, X, Mic } from 'lucide-react';

interface SpeakingPracticeHeaderProps {
  title: string;
  currentPart: number;
  currentQuestion: number;
  totalQuestions: number;
  onExit: () => void;
}

export function SpeakingPracticeHeader({
  title,
  currentPart,
  currentQuestion,
  totalQuestions,
  onExit,
}: SpeakingPracticeHeaderProps) {
  const backBtnClass =
    'w-9 h-9 rounded-full bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200/40 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-orange-200/30';

  return (
    <div className="relative z-20 bg-white/60 backdrop-blur-xl border-b border-orange-100/50 px-5 py-2.5 flex items-center justify-between shrink-0 shadow-[0_1px_12px_-2px_rgba(251,146,60,0.08)]">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onExit} className={backBtnClass}>
          <ArrowLeft className="h-4 w-4 text-orange-600" />
        </button>
        <h1 className="text-base font-bold text-gray-800 truncate">{title}</h1>
      </div>

      {/* Center */}
      <div className="flex items-center gap-2.5">
        <span className="shrink-0 px-3 py-1 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-[11px] font-semibold border border-orange-200/50 flex items-center gap-1.5 shadow-sm shadow-orange-100/40">
          <Mic className="h-3 w-3" />
          Part {currentPart}
        </span>
        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-orange-100/50 shadow-sm">
          <span className="text-[11px] text-gray-400 font-medium">Câu</span>
          <span className="text-sm font-bold tabular-nums bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {currentQuestion}
          </span>
          <span className="text-[11px] text-gray-400">/ {totalQuestions}</span>
        </div>
      </div>

      {/* Right */}
      <button
        onClick={onExit}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 border border-red-200/40 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-red-200/30"
      >
        <X className="h-4 w-4 text-red-400 hover:text-red-500" />
      </button>
    </div>
  );
}
