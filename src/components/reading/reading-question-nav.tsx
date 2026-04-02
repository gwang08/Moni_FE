'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { QuestionGroupDetail } from '@/types/test.types';

interface Props {
  questionGroups: QuestionGroupDetail[];
  /** Set of question IDs that have been answered */
  answeredQuestions: Set<number>;
  submitted?: boolean;
  onSubmit?: () => void;
  partLabel?: string;
  examMode?: boolean;
}

export function ReadingQuestionNav({ questionGroups, answeredQuestions, submitted, onSubmit, partLabel = 'Part 1', examMode = false }: Props) {
  const handleClick = (questionId: number) => {
    const el = document.getElementById(`question-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="shrink-0 bg-white border-t border-gray-300 px-4 py-2 flex items-center justify-between gap-4">
      <div className={`shrink-0 ${examMode ? 'text-xs font-semibold text-gray-700' : 'text-sm font-semibold text-gray-900'}`}>
        {partLabel}
      </div>
      {/* Question pills grouped with separators */}
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-2 py-1">
        {(() => {
          let globalNum = 0;
          return questionGroups.map((group, gi) => (
            <div key={group.id} className="flex items-center gap-0.5 shrink-0">
              {gi > 0 && <span className="text-gray-300 text-xs mx-0.5 select-none">|</span>}
              {group.questions.map((q) => {
                globalNum++;
                const isAnswered = answeredQuestions.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => handleClick(q.id)}
                    className={`shrink-0 h-7 w-7 rounded-md text-xs font-semibold transition-all border ${
                      isAnswered
                        ? examMode
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-emerald-500 text-white border-emerald-500'
                        : examMode
                          ? 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          : 'text-emerald-600 border-gray-300 hover:bg-emerald-50'
                    }`}
                  >
                    {globalNum}
                  </button>
                );
              })}
            </div>
          ));
        })()}
      </div>

      {/* Submit / Back button */}
      {!submitted ? (
        <Button
          onClick={onSubmit}
          variant="outline"
          className={`shrink-0 rounded-full px-5 h-9 text-sm font-medium ${
            examMode
              ? 'border-gray-900 bg-gray-900 text-white hover:bg-black'
              : 'border-gray-400 text-gray-800 hover:bg-gray-50'
          }`}
        >
          ✓
        </Button>
      ) : (
        <Link href="/practice?skill=reading">
          <Button
            variant="outline"
            className={`shrink-0 rounded-full px-5 h-9 text-sm font-medium ${
              examMode
                ? 'border-gray-900 bg-gray-900 text-white hover:bg-black'
                : 'border-gray-400 text-gray-800 hover:bg-gray-50'
            }`}
          >
            Quay lại danh sách
          </Button>
        </Link>
      )}
    </div>
  );
}
