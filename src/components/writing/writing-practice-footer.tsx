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
}

export function WritingPracticeFooter({
  taskType,
  wordCount,
  minWords,
  isSubmitting,
  submitted,
  onSubmit,
}: WritingPracticeFooterProps) {
  const isPartCompleted = wordCount >= minWords;

  return (
    <div className="shrink-0 bg-white border-t border-gray-300 px-4 py-1">
      <div className="flex items-end justify-between gap-2">
        {/* Part label */}
        <span
          className={`shrink-0 text-sm font-bold pb-1 ${
            isPartCompleted ? 'text-emerald-600' : 'text-gray-900'
          }`}
        >
          Part {taskType}
        </span>

        {/* Spacer - writing doesn't have question numbers */}
        <div className="flex-1" />

        {/* Navigation controls */}
        <div className="flex items-center gap-2 shrink-0 pb-1">
          {/* Prev button - disabled for writing since there's no multi-part navigation within a single task */}
          <button
            disabled
            className="w-[34px] h-[34px] flex items-center justify-center rounded bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>

          {/* Next/Submit button */}
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
