'use client';

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { StimulusDetail, QuestionGroupDetail } from '@/types/test.types';

interface Props {
  stimuli: StimulusDetail[];
  questionGroups: QuestionGroupDetail[];
  answeredQuestions: Set<number>;
  submitted?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  onNavigate?: (questionId: number) => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  activeQuestionId?: number | null;
}

/**
 * Navigation bar for Listening Exam mode (full test).
 * Shows ALL 40 questions in a flat list without part divisions.
 */
export function ListeningFullExamQuestionNav({
  stimuli,
  questionGroups,
  answeredQuestions,
  submitted,
  onPrev,
  onNext,
  onSubmit,
  onNavigate,
  canGoPrev = true,
  canGoNext = true,
  activeQuestionId = null,
}: Props) {
  const safeStimuli = stimuli && Array.isArray(stimuli) ? stimuli : [];

  // Flatten all questions from all stimuli
  const allQuestionIds = safeStimuli.flatMap((s) => s.questionGroups.flatMap((g) => g.questions.map((q) => q.id)));

  return (
    <div className="shrink-0 bg-white border-t border-gray-300 px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        {/* Question numbers - scrollable, all questions in one row */}
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1 w-max">
            {/* Progress bars */}
            <div className="flex items-center gap-1 mb-1">
              {allQuestionIds.map((qId) => {
                const isAnswered = answeredQuestions.has(qId);
                return (
                  <div key={`bar-${qId}`} className="w-[32px] flex items-center">
                    <span className={`block h-[2px] w-full rounded-full ${isAnswered ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  </div>
                );
              })}
            </div>

            {/* Question buttons */}
            <div className="flex items-center gap-1">
              {allQuestionIds.map((qId) => {
                const isAnswered = answeredQuestions.has(qId);
                const isCurrent = qId === activeQuestionId;
                const globalNumber = allQuestionIds.indexOf(qId) + 1;

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
                    className={`w-[32px] h-[32px] flex items-center justify-center text-[13px] font-normal transition-all bg-white rounded ${
                      isCurrent
                        ? 'border-2 border-blue-600 text-gray-900'
                        : isAnswered
                          ? 'border border-transparent text-gray-700 hover:bg-gray-50'
                          : 'border border-transparent text-gray-700 hover:bg-gray-50'
                    } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {globalNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation controls - right side */}
        <div className="flex items-center gap-2 shrink-0">
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
