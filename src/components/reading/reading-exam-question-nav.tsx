'use client';

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { QuestionGroupDetail } from '@/types/test.types';

interface Props {
  questionGroups: QuestionGroupDetail[];
  answeredQuestions: Set<number>;
  submitted?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  partLabel?: string;
  currentGroupIndex?: number;
}

export function ReadingExamQuestionNav({
  questionGroups,
  answeredQuestions,
  submitted,
  onPrev,
  onNext,
  canGoPrev = true,
  canGoNext = true,
  partLabel,
  currentGroupIndex = 0,
}: Props) {
  const questionIds = questionGroups.flatMap((g) => g.questions.map((q) => q.id));
  const currentQuestionId = questionIds[currentGroupIndex] || questionIds[0];

  return (
    <div className="shrink-0 bg-white border-t border-gray-300 px-4 py-3 flex items-center justify-between">
      {/* Part label and question numbers */}
      <div className="flex items-center gap-2">
        {partLabel && (
          <span className="text-sm font-bold text-gray-900 mr-1">{partLabel}</span>
        )}
        <div className="flex items-center gap-0.5">
          {questionIds.map((qId, idx) => {
            const isAnswered = answeredQuestions.has(qId);
            const isCurrent = qId === currentQuestionId;
            return (
              <button
                key={qId}
                disabled={submitted}
                className={`w-8 h-8 flex items-center justify-center text-xs font-normal transition-all border border-transparent hover:bg-gray-100 ${
                  isCurrent 
                    ? 'text-blue-600 underline underline-offset-2' 
                    : isAnswered
                      ? 'text-gray-900'
                      : 'text-gray-600'
                } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation arrows + Submit */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={!canGoPrev || submitted}
          className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
            canGoPrev && !submitted
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={onNext}
          disabled={!canGoNext || submitted}
          className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
            canGoNext && !submitted
              ? 'bg-gray-900 text-white hover:bg-black'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <button
          disabled={submitted}
          className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
            submitted
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Check className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
