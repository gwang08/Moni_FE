'use client';

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { QuestionGroupDetail } from '@/types/test.types';

interface Props {
  questionGroups: QuestionGroupDetail[];
  answeredQuestions: Set<number>;
  submitted?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  onNavigate?: (questionId: number) => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  partLabel?: string;
  activeQuestionId?: number | null;
}

export function ListeningExamQuestionNav({
  questionGroups,
  answeredQuestions,
  submitted,
  onPrev,
  onNext,
  onSubmit,
  onNavigate,
  canGoPrev = true,
  canGoNext = true,
  partLabel,
  activeQuestionId = null,
}: Props) {
  const questionIds = questionGroups.flatMap((g) => g.questions.map((q) => q.id));
  const isPartCompleted = questionIds.length > 0 && questionIds.every((qId) => answeredQuestions.has(qId));

  const cellWidth = 32;
  const cellGap = 2;
  const gridStyle = {
    gridTemplateColumns: `repeat(${questionIds.length}, ${cellWidth}px)`,
    columnGap: `${cellGap}px`,
  } as const;

  return (
    <div className="shrink-0 bg-white border-t border-gray-300 px-4 py-1">
      <div className="flex items-end justify-between gap-2">
        {/* Part label */}
        {partLabel && (
          <span className={`shrink-0 text-sm font-bold pb-1 ${isPartCompleted ? 'text-emerald-600' : 'text-gray-900'}`}>
            {partLabel}
          </span>
        )}

        {/* Question numbers */}
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid w-max items-center" style={gridStyle}>
            {questionIds.map((qId) => {
              const isAnswered = answeredQuestions.has(qId);
              return (
                <div key={`bar-${qId}`} className="flex items-center">
                  <span className={`block h-[2px] w-full rounded-full ${isAnswered ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                </div>
              );
            })}
          </div>

          <div className="mt-1 grid w-max items-center" style={gridStyle}>
            {questionIds.map((qId, idx) => {
              const isAnswered = answeredQuestions.has(qId);
              const isCurrent = qId === (activeQuestionId ?? questionIds[0]);

              return (
                <button
                  key={qId}
                  type="button"
                  onClick={() => {
                    onNavigate?.(qId);
                    const el = document.getElementById(`question-${qId}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  disabled={submitted}
                  className={`w-full h-[34px] flex items-center justify-center text-[13px] font-normal transition-all bg-white ${
                    isCurrent
                      ? 'border-2 border-blue-600 text-gray-900'
                      : isAnswered
                        ? 'border border-transparent text-gray-700 hover:bg-gray-50'
                        : 'border border-transparent text-gray-700 hover:bg-gray-50'
                  } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-2 shrink-0 pb-1">
          <button
            onClick={onPrev}
            disabled={!canGoPrev || submitted}
            className={`w-[34px] h-[34px] flex items-center justify-center rounded transition-colors ${
              canGoPrev && !submitted
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={onNext}
            disabled={!canGoNext || submitted}
            className={`w-[34px] h-[34px] flex items-center justify-center rounded transition-colors ${
              canGoNext && !submitted
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={onSubmit}
            disabled={submitted}
            className={`w-[34px] h-[34px] flex items-center justify-center rounded transition-colors ${
              submitted
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title="Nộp bài"
          >
            <Check className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
