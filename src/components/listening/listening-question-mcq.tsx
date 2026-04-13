'use client';

import { useState } from 'react';
import { Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
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
  explanation?: { text?: string; evidence?: string };
  onAnswer: (questionId: number, optionId: number) => void;
  onLocateEvidence?: (evidence: string) => void;
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
  onLocateEvidence,
  examMode = false,
}: Props) {
  const selected = multiple ? (selectedIds ?? []) : (selectedId != null ? [selectedId] : []);
  const hasAnswer = selected.length > 0;

  if (examMode) {
    return (
      <div id={`question-${questionId}`} className="bg-white">
        <div className="flex items-start gap-4 mb-3">
          <span className="min-w-[20px] text-sm font-bold text-gray-900 mt-0.5">{position}</span>
          <p className="flex-1 text-sm text-gray-800 font-normal leading-relaxed mb-3">{content}</p>
        </div>

        <div className="space-y-1.5">
          {options.map((option) => {
            const isSelected = selected.includes(option.id);

            return (
              <label
                key={option.id}
                className={`flex items-center gap-3 rounded-sm px-1 py-1.5 transition-colors ${
                  isSelected
                    ? 'bg-gray-50 text-gray-900'
                    : 'text-gray-800 hover:bg-gray-50/60'
                } ${submitted ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
              >
                <input
                  type={multiple ? 'checkbox' : 'radio'}
                  name={`question-${questionId}`}
                  value={option.id}
                  checked={isSelected}
                  disabled={submitted}
                  onChange={() => !submitted && onAnswer(questionId, option.id)}
                  className="h-4 w-4 shrink-0 border-gray-400 text-gray-900 focus:ring-gray-900"
                />
                <span className={`text-sm font-normal leading-5 ${isSelected ? 'font-medium' : ''}`}>
                  {option.content}
                </span>
              </label>
            );
          })}
        </div>

        {submitted && !hasAnswer && (
          <p className="mt-3 text-xs text-gray-500 italic">Chưa trả lời</p>
        )}
      </div>
    );
  }

  // Non-exam mode rendering (review mode)
  const correctOption = options.find(o => o.isCorrect);
  const isCorrect = selectedId != null && correctOption?.id === selectedId;
  const isSkipped = selectedId == null;

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

      {submitted && (
        <MCQReviewSection
          position={position}
          isSkipped={isSkipped}
          isCorrect={isCorrect}
          correctOption={correctOption}
          explanation={explanation}
          onLocateEvidence={onLocateEvidence}
        />
      )}
    </div>
  );
}

/** Separate component for MCQ review section */
function MCQReviewSection({ position, isSkipped, isCorrect, correctOption, explanation, onLocateEvidence }: {
  position: number;
  isSkipped: boolean;
  isCorrect: boolean;
  correctOption: OptionDetail | undefined;
  explanation?: { text?: string; evidence?: string };
  onLocateEvidence?: (evidence: string) => void;
}) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-gray-900 min-w-[20px]">{position}.</span>
        {isSkipped && (
          <span className="text-gray-500 italic">
            Chưa trả lời — Đáp án: <strong className="text-green-600">{correctOption?.content}</strong>
          </span>
        )}
        {!isSkipped && isCorrect && (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-900" />
            <span className="text-gray-900 font-semibold">Đúng</span>
          </span>
        )}
        {!isSkipped && !isCorrect && (
          <span className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-gray-700" />
            <span className="text-gray-800">
              Đáp án: <strong className="text-green-600">{correctOption?.content}</strong>
            </span>
          </span>
        )}
      </div>

      {explanation && (explanation.text || explanation.evidence) && (
        <ExplanationSection explanation={explanation} onLocateEvidence={onLocateEvidence} />
      )}
    </div>
  );
}

/** Reusable explanation section with toggleable explanation text */
function ExplanationSection({ explanation, onLocateEvidence }: {
  explanation: { text?: string; evidence?: string };
  onLocateEvidence?: (evidence: string) => void;
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Remove "Câu X - Giải thích đáp án" prefix from explanation text
  const cleanExplanation = explanation.text?.replace(/^Câu\s+\d+\s*[-–—]\s*Giải thích đáp án\s*/i, '') || explanation.text;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        {explanation.evidence && onLocateEvidence && (
          <button
            type="button"
            onClick={() => {
              const evidenceStr = explanation.evidence || '';
              const chunks = evidenceStr.split('\n---\n').filter((e: string) => e.trim());
              if (chunks.length > 0) onLocateEvidence(chunks[0].trim());
            }}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
            title="Xem dẫn chứng"
          >
            <TargetIcon className="h-4 w-4 text-gray-900" strokeWidth={2} />
          </button>
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
