'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  totalQuestions: number;
  answeredQuestions: Set<number>;
  questionIds: number[];
  submitted?: boolean;
  onNavigate?: (questionId: number) => void;
  onSubmit?: () => void;
}

export function ListeningQuestionNav({
  answeredQuestions,
  questionIds,
  submitted,
  onNavigate,
  onSubmit,
}: Props) {
  const handleClick = (questionId: number) => {
    onNavigate?.(questionId);
    const el = document.getElementById(`question-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="shrink-0 bg-white border-t border-gray-100 px-5 py-2 flex items-center justify-between gap-4">
      {/* Question pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide rounded-full border border-emerald-300 px-3 py-1.5">
        {questionIds.map((qId, idx) => {
          const isAnswered = answeredQuestions.has(qId);
          return (
            <button
              key={qId}
              onClick={() => handleClick(qId)}
              className={`shrink-0 w-7 h-7 rounded-md text-xs font-semibold transition-all ${
                isAnswered
                  ? 'bg-emerald-500 text-white'
                  : 'text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
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
        <Link href="/practice?skill=listening">
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
