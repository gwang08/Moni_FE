'use client';

import { ArrowLeft, Clock, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WritingTaskType } from '@/types/writing.types';

interface WritingPracticeHeaderProps {
  title: string;
  taskType: WritingTaskType;
  elapsedTime: string;
  isGrading: boolean;
  canGrade: boolean;
  submitted?: boolean;
  isSubmitting?: boolean;
  onGrade: () => void;
  onExit: () => void;
}

export function WritingPracticeHeader({
  title,
  taskType,
  elapsedTime,
  isGrading,
  canGrade,
  submitted = false,
  isSubmitting = false,
  onGrade,
  onExit,
}: WritingPracticeHeaderProps) {
  return (
    <div className="relative z-20 bg-white/60 backdrop-blur-xl border-b border-teal-100/50 px-5 py-2.5 flex items-center justify-between shrink-0 shadow-[0_1px_12px_-2px_rgba(20,184,166,0.08)]">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onExit}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 border border-teal-200/40 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-teal-200/30"
        >
          <ArrowLeft className="h-4 w-4 text-teal-600" />
        </button>
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-bold text-gray-800">{title}</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 text-[11px] font-semibold border border-teal-200/60">
            Task {taskType}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-teal-50/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-teal-100/40 ml-1">
          <Clock className="h-3 w-3 text-teal-400" />
          <span className="text-xs font-mono tabular-nums text-teal-500/70">{elapsedTime}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {!submitted && (
          <Button
            onClick={onGrade}
            disabled={!canGrade || isGrading || isSubmitting}
            className="rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-300/40 px-5 text-sm h-9 gap-1.5 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-teal-300/50 border border-teal-300/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang nộp...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Nộp bài
              </>
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={onExit}
          className="rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 text-sm h-9"
        >
          Thoát
        </Button>
      </div>
    </div>
  );
}
