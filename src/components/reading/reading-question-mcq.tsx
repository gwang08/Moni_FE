'use client';

import { CheckCircle2, Square, CheckSquare, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import type { OptionDetail } from '@/types/test.types';

// Custom Target/Aim icon component - bullseye style
function TargetIcon({ className = 'h-4 w-4', strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

interface Props {
  questionId: number;
  position: number;
  content: string;
  options: OptionDetail[];
  selectedId: number | undefined;
  selectedIds?: number[];
  multiple?: boolean;
  submitted: boolean;
  readOnly?: boolean;
  explanation?: { text?: string; evidence?: string; offsets?: number[] };
  onAnswer: (questionId: number, optionId: number) => void;
  onLocateEvidence?: (evidence: string, offset?: number) => void;
  examMode?: boolean;
}

/** Button-style renderer for MCQ, MCQ_MULTIPLE, TFNG, YNNG */
export function ReadingQuestionMcq({ questionId, position, content, options, selectedId, selectedIds, multiple, submitted, readOnly = false, explanation, onAnswer, onLocateEvidence, examMode = false }: Props) {
  const isDisabled = submitted || readOnly;
  const selected = multiple ? (selectedIds ?? []) : (selectedId != null ? [selectedId] : []);
  const hasAnswer = selected.length > 0;

  // Show correct answers when submitted (even if user didn't answer)
  const showResult = submitted;

  // Exam mode: boxed layout with grid options
  if (examMode) {
    return (
      <div id={`question-${questionId}`} className="bg-white px-5 py-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-sm border border-blue-600 bg-white px-2 text-lg font-bold text-gray-900">
            {position}
          </span>
          <p className="flex-1 pt-1 text-[15px] text-gray-900 font-normal leading-relaxed">{content}</p>
        </div>

        <div className="space-y-0.5">
          {options.map((option) => {
            const isSelected = selected.includes(option.id);

            const className = `w-full flex items-center gap-3 px-3 py-4 text-left transition-colors ${
              isSelected
                ? 'bg-[#cfe0f4] text-gray-900'
                : 'bg-white text-gray-900 hover:bg-gray-50'
            } ${submitted ? 'cursor-default opacity-90' : 'cursor-pointer'}`;

            return (
              <label key={option.id} className={className}>
                <input
                  type={multiple ? 'checkbox' : 'radio'}
                  name={`question-${questionId}`}
                  value={option.id}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => !isDisabled && onAnswer(questionId, option.id)}
                  className="h-4 w-4 accent-blue-600 text-blue-600 border-gray-400 focus:ring-blue-600"
                />
                <span className={`text-sm font-normal leading-tight ${isSelected ? 'font-medium' : ''}`}>
                  {option.content}
                </span>
              </label>
            );
          })}
        </div>

        {isDisabled && explanation && (explanation.text || explanation.evidence) && (
          <ExplanationSection explanation={explanation} onLocateEvidence={onLocateEvidence} />
        )}
      </div>
    );
  }

  // Non-exam mode rendering
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
          className += isDisabled ? ' cursor-default' : ' cursor-pointer';

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !isDisabled && onAnswer(questionId, option.id)}
              className={className}
              disabled={isDisabled}
            >
              {showResult && option.isCorrect && isSelected ? (
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
                {option.content}
              </span>
            </button>
          );
        })}
      </div>

      {submitted && explanation && (explanation.text || explanation.evidence) && (
        <ExplanationSection explanation={explanation} onLocateEvidence={onLocateEvidence} />
      )}
    </div>
  );
}

/** Reusable explanation section with toggleable explanation text */
function ExplanationSection({ explanation, onLocateEvidence }: {
  explanation: { text?: string; evidence?: string; offsets?: number[] };
  onLocateEvidence?: (evidence: string, offset?: number) => void;
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Remove "Câu X - Giải thích đáp án" prefix from explanation text
  const cleanExplanation = explanation.text?.replace(/^Câu\s+\d+\s*[-–—]\s*Giải thích đáp án\s*/i, '') || explanation.text;

  const evidenceChunks = explanation.evidence?.split('\n---\n').filter((e: string) => e.trim()) || [];
  const offsets = explanation.offsets || [];

  return (
    <div className="mt-4 pt-3 border-t border-gray-200">
      <div className="flex items-center gap-2">
        {evidenceChunks.length > 0 && onLocateEvidence && (
          <div className="flex gap-1">
            {evidenceChunks.map((chunk, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onLocateEvidence(chunk.trim(), offsets[i])}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
                title={evidenceChunks.length > 1 ? `Xem dẫn chứng ${i + 1}` : 'Xem dẫn chứng'}
              >
                <TargetIcon className="h-4 w-4 text-gray-900" strokeWidth={2} />
              </button>
            ))}
          </div>
        )}
        {explanation.text && (
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              showExplanation ? 'bg-yellow-200 hover:bg-yellow-300' : 'bg-yellow-100 hover:bg-yellow-200'
            }`}
            title="Xem giải thích"
          >
            <Lightbulb className={`h-4 w-4 ${showExplanation ? 'text-yellow-800' : 'text-yellow-700'}`} />
          </button>
        )}
      </div>
      {showExplanation && cleanExplanation && (
        <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
          {cleanExplanation}
        </div>
      )}
    </div>
  );
}
