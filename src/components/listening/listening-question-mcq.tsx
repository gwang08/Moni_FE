'use client';

import type { OptionDetail } from '@/types/test.types';

interface Props {
  questionId: number;
  position: number;
  content: string;
  options: OptionDetail[];
  selectedId: number | undefined;
  selectedIds?: number[];
  multiple?: boolean;
  submitted: boolean;
  explanation?: { text?: string; evidence?: string };
  onAnswer: (questionId: number, optionId: number) => void;
  examMode?: boolean;
}

/** IELTS-style MCQ renderer for listening exam */
export function ListeningQuestionMcq({
  questionId,
  position,
  content,
  options,
  selectedId,
  selectedIds,
  multiple,
  submitted,
  explanation,
  onAnswer,
  examMode = false,
}: Props) {
  const selected = multiple ? (selectedIds ?? []) : (selectedId != null ? [selectedId] : []);
  const hasAnswer = selected.length > 0;

  return (
    <div id={`question-${questionId}`} className="mb-4">
      <div className="flex items-start gap-2 mb-3">
        <span className="font-bold text-gray-900 min-w-[20px]">{position}</span>
        <p className="text-sm text-gray-900 flex-1 leading-6">{content}</p>
      </div>

      <div className="space-y-3 ml-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);

          return (
            <label
              key={option.id}
              className={`flex items-start gap-3 cursor-pointer ${submitted ? 'cursor-default' : ''}`}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={`question-${questionId}`}
                value={option.id}
                checked={isSelected}
                disabled={submitted}
                onChange={() => !submitted && onAnswer(questionId, option.id)}
                className="mt-0.5 h-4 w-4 shrink-0 border-2 border-gray-400 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span className="text-sm text-gray-900 leading-6">
                {option.content}
              </span>
            </label>
          );
        })}
      </div>

      {submitted && !hasAnswer && (
        <p className="mt-2 text-xs text-gray-500 italic ml-2">Not answered</p>
      )}
    </div>
  );
}
