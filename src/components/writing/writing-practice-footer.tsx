'use client';

import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { WritingTaskType } from '@/types/writing.types';

interface WritingPracticeFooterProps {
  taskType: WritingTaskType;
  wordCount: number;
  minWords: number;
  isSubmitting: boolean;
  submitted: boolean;
  onSubmit: () => void;
  // Navigation props
  totalTasks?: number;
  activeTaskIndex?: number;
  onTaskChange?: (index: number) => void;
  taskTypes?: WritingTaskType[];
}

export function WritingPracticeFooter({
  taskType,
  wordCount,
  minWords,
  isSubmitting,
  submitted,
  onSubmit,
  totalTasks = 1,
  activeTaskIndex = 0,
  onTaskChange,
  taskTypes = [2],
}: WritingPracticeFooterProps) {
  const isPartCompleted = wordCount >= minWords;
  const canGoPrev = activeTaskIndex > 0;
  const canGoNext = activeTaskIndex < totalTasks - 1;

  return (
    <div className="shrink-0 bg-white border-t border-gray-300 px-4 py-1">
      <div className="flex items-center justify-between gap-3">
        {/* Part navigation (Mini-map style) */}
        <div className="flex items-center gap-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {taskTypes.map((tType, idx) => {
            const isActive = idx === activeTaskIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onTaskChange?.(idx)}
                className={`shrink-0 text-sm font-bold pb-1 transition-colors border-b-2 ${
                  isActive
                    ? 'text-emerald-600 border-emerald-600'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                Part {tType}
              </button>
            );
          })}
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-2 shrink-0 pb-1">
          <button
            onClick={() => canGoPrev && onTaskChange?.(activeTaskIndex - 1)}
            disabled={!canGoPrev}
            className={`w-[34px] h-[34px] flex items-center justify-center rounded transition-colors ${
              canGoPrev
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>

          <button
            onClick={() => canGoNext && onTaskChange?.(activeTaskIndex + 1)}
            disabled={!canGoNext}
            className={`w-[34px] h-[34px] flex items-center justify-center rounded transition-colors ${
              canGoNext
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>

          {/* Submit button */}
          <button
            onClick={onSubmit}
            disabled={isSubmitting || submitted || wordCount === 0}
            className={`w-[34px] h-[34px] flex items-center justify-center rounded transition-colors ${
              submitted
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : wordCount === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title={submitted ? 'Đã nộp' : 'Nộp bài'}
          >
            {submitted ? (
              <Check className="h-[18px] w-[18px] text-green-600" />
            ) : (
              <Check className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
