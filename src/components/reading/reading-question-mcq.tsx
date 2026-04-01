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
  onLocateEvidence?: (evidence: string) => void;
  examMode?: boolean;
}

/** Button-style renderer for MCQ, MCQ_MULTIPLE, TFNG, YNNG */
export function ReadingQuestionMcq({ questionId, position, content, options, selectedId, selectedIds, multiple, submitted, explanation, onAnswer, onLocateEvidence, examMode = false }: Props) {
  const selected = multiple ? (selectedIds ?? []) : (selectedId != null ? [selectedId] : []);
  const hasAnswer = selected.length > 0;
  // Show correct answers when submitted (even if user didn't answer)
  const showResult = submitted;

  return (
    <div id={`question-${questionId}`} className={`rounded-lg p-4 border ${examMode ? 'border-gray-300 bg-white' : 'border-gray-200 bg-white'}`}>
      <p className="text-sm font-medium text-gray-900 mb-3 leading-6">
        <span className="font-bold mr-1">{position}.</span>
        {content}
      </p>

      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isCorrect = option.isCorrect;
          const isSelectedCorrect = showResult && isCorrect && isSelected;
          const isUnselectedCorrect = showResult && isCorrect && !isSelected;

          let className = 'w-full flex items-center gap-3 text-sm px-3 py-3 rounded-md border transition-colors text-left ';
          if (examMode) {
            if (isSelected) {
              className += 'bg-gray-100 text-gray-900 border-gray-400';
            } else {
              className += 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50';
            }
          } else if (isSelectedCorrect) {
            className += 'bg-green-100 text-green-700 border-green-400';
          } else if (isUnselectedCorrect) {
            className += 'bg-green-50 text-green-700 border-green-300';
          } else if (showResult && isSelected && !isCorrect) {
            className += 'bg-red-50 text-red-700 border-red-300';
          } else if (isSelected) {
            className += 'bg-blue-50 text-blue-700 border-blue-300';
          } else {
            className += 'text-gray-700 border-gray-200 hover:bg-gray-50';
          }
          className += submitted ? ' cursor-default' : ' cursor-pointer';

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !submitted && onAnswer(questionId, option.id)}
              className={className}
            >
              {isSelectedCorrect ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : multiple ? (
                isSelected
                  ? <CheckSquare className={`h-4 w-4 shrink-0 ${examMode ? 'text-gray-900' : 'text-blue-500'}`} />
                  : <Square className="h-4 w-4 shrink-0 text-gray-300" />
              ) : (
                <span className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  examMode
                    ? (isSelected ? 'border-gray-900' : 'border-gray-400')
                    : (isSelected ? 'border-blue-500' : 'border-gray-300')
                }`}>
                  {isSelected && <span className={`h-2 w-2 rounded-full ${examMode ? 'bg-gray-900' : 'bg-blue-500'}`} />}
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
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Giải thích:</strong> {explanation.text}
          </p>
          {explanation.evidence && (
            <div className="space-y-1 mt-1">
              {explanation.evidence.split('\n---\n').filter((e: string) => e.trim()).map((chunk: string, i: number) => (
                <p key={i}
                  className={`text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded ${onLocateEvidence ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                  onClick={() => onLocateEvidence?.(chunk.trim())}
                >
                  Dẫn chứng {i + 1}: &ldquo;{chunk.trim()}&rdquo;
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {submitted && !hasAnswer && (
        <p className="mt-2 text-xs text-gray-500 italic">Chưa trả lời</p>
      )}
    </div>
  );
}
