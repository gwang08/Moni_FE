'use client';

interface Props {
  totalQuestions: number;
  answeredQuestions: Set<number>;
  questionIds: number[];
  onNavigate?: (questionId: number) => void;
}

export function ListeningQuestionNav({ totalQuestions, answeredQuestions, questionIds, onNavigate }: Props) {
  const handleClick = (questionId: number, index: number) => {
    onNavigate?.(questionId);
    // Scroll to question element
    const el = document.getElementById(`question-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="bg-white border-b px-4 py-2 sticky top-[57px] z-10 shrink-0">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <span className="text-xs text-gray-400 shrink-0 mr-1">Câu:</span>
        {questionIds.map((qId, idx) => {
          const isAnswered = answeredQuestions.has(qId);
          return (
            <button
              key={qId}
              onClick={() => handleClick(qId, idx)}
              className={`
                shrink-0 w-7 h-7 rounded-full text-xs font-medium transition-colors
                ${isAnswered
                  ? 'bg-violet-600 text-white'
                  : 'border border-gray-300 text-gray-500 hover:border-violet-400 hover:text-violet-600'
                }
              `}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
