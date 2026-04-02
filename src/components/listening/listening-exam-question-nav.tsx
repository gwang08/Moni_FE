'use client';

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface Props {
  totalQuestions: number;
  answeredQuestions: Set<number>;
  questionIds: number[];
  currentQuestionIndex?: number;
  submitted?: boolean;
  onNavigate?: (questionId: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
}

export function ListeningExamQuestionNav({
  answeredQuestions,
  questionIds,
  currentQuestionIndex = 0,
  submitted,
  onNavigate,
  onPrev,
  onNext,
  onSubmit,
  canGoPrev = true,
  canGoNext = true,
}: Props) {
  const handleClick = (questionId: number) => {
    onNavigate?.(questionId);
    const el = document.getElementById(`question-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrev = () => {
    if (!canGoPrev) return;
    onPrev?.();
  };

  const handleNext = () => {
    if (!canGoNext) return;
    onNext?.();
  };

  return (
    <div className="shrink-0 bg-white border-t border-gray-300 px-4 py-3 flex items-center justify-between">
      {/* Question numbers */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-900 mr-1">
          Part {questionIds.length > 0 ? Math.ceil((currentQuestionIndex + 1) / 10) : 1}
        </span>
        <div className="flex items-center gap-0.5">
          {questionIds.map((qId, idx) => {
            const isAnswered = answeredQuestions.has(qId);
            const isActive = idx === currentQuestionIndex;
            return (
              <button
                key={qId}
                onClick={() => handleClick(qId)}
                disabled={submitted}
                className={`w-8 h-8 flex items-center justify-center text-xs font-normal transition-all border border-transparent hover:bg-gray-100 ${
                  isActive
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
          onClick={handlePrev}
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
          onClick={handleNext || onSubmit}
          disabled={!canGoNext || submitted}
          className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
            canGoNext && !submitted
              ? 'bg-gray-900 text-white hover:bg-black'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {onSubmit ? (
            <span className="text-xs font-semibold">Submit</span>
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
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
