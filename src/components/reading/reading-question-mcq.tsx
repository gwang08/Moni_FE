'use client';

import { CheckCircle2, Square, CheckSquare } from 'lucide-react';
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
}

/** Button-style renderer for MCQ, MCQ_MULTIPLE, TFNG, YNNG */
export function ReadingQuestionMcq({ questionId, position, content, options, selectedId, selectedIds, multiple, submitted, explanation, onAnswer }: Props) {
  const selected = multiple ? (selectedIds ?? []) : (selectedId != null ? [selectedId] : []);
  const hasAnswer = selected.length > 0;
  const showResult = submitted && hasAnswer;

  return (
    <div id={`question-${questionId}`} className="border border-gray-200 rounded-lg p-4">
      <p className="text-sm font-medium text-gray-800 mb-3">
        <span className="text-blue-600 font-bold mr-1">{position}.</span>
        {content}
      </p>

      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isCorrect = option.isCorrect;

          let className = 'w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors text-left ';
          if (showResult && isCorrect) {
            className += 'bg-green-50 text-green-700 border-green-300';
          } else if (showResult && isSelected && !isCorrect) {
            className += 'bg-red-50 text-red-700 border-red-300';
          } else if (isSelected) {
            className += 'bg-blue-50 text-blue-700 border-blue-300';
          } else {
            className += 'text-gray-600 border-gray-200 hover:bg-gray-50';
          }
          className += submitted ? ' cursor-default' : ' cursor-pointer';

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !submitted && onAnswer(questionId, option.id)}
              className={className}
            >
              {showResult && isCorrect ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : multiple ? (
                isSelected
                  ? <CheckSquare className="h-4 w-4 shrink-0 text-blue-500" />
                  : <Square className="h-4 w-4 shrink-0 text-gray-300" />
              ) : (
                <span className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  isSelected ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {isSelected && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                </span>
              )}
              <span>
                {option.label && <strong className="mr-1">{option.label}.</strong>}
                {option.content}
              </span>
            </button>
          );
        })}
      </div>

      {submitted && explanation?.text && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <strong>Giải thích:</strong> {explanation.text}
          </p>
          {explanation.evidence && (
            <div className="space-y-1 mt-1">
              {explanation.evidence.split('\n---\n').filter((e: string) => e.trim()).map((chunk: string, i: number) => (
                <p key={i} className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                  Dẫn chứng: &ldquo;{chunk.trim()}&rdquo;
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {submitted && !hasAnswer && (
        <p className="mt-2 text-xs text-gray-400 italic">Chưa trả lời</p>
      )}
    </div>
  );
}
