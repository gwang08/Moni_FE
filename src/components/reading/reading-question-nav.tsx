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
}

export function ReadingQuestionNav({ questionGroups, answeredQuestions, submitted, onSubmit }: Props) {
  const handleClick = (questionId: number) => {
    const el = document.getElementById(`question-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="shrink-0 bg-white border-t border-gray-100 px-5 py-2 flex items-center justify-between gap-4">
      {/* Question pills grouped with separators */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide rounded-full border border-emerald-300 px-3 py-1.5 min-w-0 flex-1">
        {questionGroups.map((group, gi) => (
          <div key={group.id} className="flex items-center gap-1 shrink-0">
            {/* Group separator */}
            {gi > 0 && (
              <span className="text-gray-300 text-xs mx-1 select-none">|</span>
            )}
            {/* Group label */}
            <span className="text-xs text-emerald-600 font-semibold shrink-0 mr-0.5">
              {gi + 1}
            </span>
            {/* Question pills for this group */}
            {group.questions.map((q) => {
              const isAnswered = answeredQuestions.has(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => handleClick(q.id)}
                  className={`shrink-0 w-7 h-7 rounded-md text-xs font-semibold transition-all ${
                    isAnswered
                      ? 'bg-emerald-500 text-white'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {q.position}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Submit / Back button */}
      {!submitted ? (
        <Button
          onClick={onSubmit}
          variant="outline"
          className="shrink-0 rounded-full border-gray-300 text-gray-600 hover:bg-gray-50 px-6 h-9 text-sm font-medium"
        >
          Hoàn thành
        </Button>
      ) : (
        <Link href="/practice?skill=reading">
          <Button
            variant="outline"
            className="shrink-0 rounded-full border-gray-300 text-gray-600 hover:bg-gray-50 px-6 h-9 text-sm font-medium"
          >
            Quay lại danh sách
          </Button>
        </Link>
      )}
    </div>
  );
}
