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
  readOnly?: boolean;
  explanation?: { 
    text?: string; 
    evidence?: string;
    offsets?: number[];
    startOffsets?: number[];
    endOffsets?: number[];
    startTimes?: number[];
  };
  onAnswer: (questionId: number, optionId: number) => void;
  onLocateEvidence?: (evidence: string, offset?: number, startOffset?: number, endOffset?: number, startTime?: number) => void;
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
  readOnly = false,
  explanation,
  onAnswer,
  onLocateEvidence,
  examMode = false,
}: Props) {
  const [showExplanation, setShowExplanation] = useState(false);
  const selected = multiple ? (selectedIds ?? []) : (selectedId != null ? [selectedId] : []);
  const isDisabled = submitted || readOnly;

  if (submitted && !examMode) {
    const evidenceChunks = explanation?.evidence?.split('\n---\n').filter((e: string) => e.trim()) || [];
    const offsets = explanation?.offsets || [];
    const startOffsets = explanation?.startOffsets || [];
    const endOffsets = explanation?.endOffsets || [];
    const startTimes = explanation?.startTimes || [];
    const evidence = explanation?.evidence?.trim() || '';

    // Review mode: Direct highlights on options (like Reading)
    return (
      <div id={`question-${questionId}`} className="py-6 border-b border-slate-100 last:border-0 group">
        <div className="flex items-start gap-4 mb-5">
          <span className="min-w-[28px] text-[15px] font-bold text-slate-900 mt-0.5">
            {position}
          </span>
          <p className="flex-1 text-[15px] text-slate-800 font-medium leading-relaxed">{content}</p>
        </div>

        <div className="space-y-2.5">
          {options.map((option) => {
            const isSelected = selected.includes(option.id);
            const isOptCorrect = option.isCorrect;
            
            // Highlight Logic matching Reading review style
            let variantClass = "border-slate-200 text-slate-600 bg-white";
            
            if (isSelected && isOptCorrect) {
              variantClass = "bg-green-100 border-green-500 text-green-800 font-semibold shadow-sm ring-1 ring-green-500/20";
            } else if (isSelected && !isOptCorrect) {
              variantClass = "bg-red-50 border-red-400 text-red-700 font-semibold shadow-sm ring-1 ring-red-400/20";
            } else if (!isSelected && isOptCorrect) {
              variantClass = "bg-green-50/50 border-green-300 text-green-700 font-medium italic";
            }

            return (
              <div key={option.id} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${variantClass}`}>
                <div className={`h-4.5 w-4.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  isSelected ? (isOptCorrect ? 'border-green-600' : 'border-red-500') : (isOptCorrect ? 'border-green-400' : 'border-slate-300')
                }`}>
                  {(isSelected || isOptCorrect) && (
                    <div className={`h-2 w-2 rounded-full ${isOptCorrect ? 'bg-green-600' : 'bg-red-500'}`} />
                  )}
                </div>
                <span className="text-[14px] leading-snug">
                  {option.content}
                </span>
                {isSelected && isOptCorrect && <CheckCircle2 className="h-4.5 w-4.5 ml-auto text-green-600 shrink-0" />}
                {isSelected && !isOptCorrect && <XCircle className="h-4.5 w-4.5 ml-auto text-red-500 shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Action Icons (Evidence & Explanation) */}
        <div className="mt-5 flex items-center gap-3">
          {evidenceChunks.length > 0 && onLocateEvidence && (
            <button
              type="button"
              onClick={() => onLocateEvidence(evidence, offsets[0], startOffsets[0], endOffsets[0], startTimes[0])}
              className="flex items-center justify-center h-8 w-8 hover:bg-slate-100 rounded-full transition-colors text-slate-900 border border-slate-100 shadow-sm shrink-0"
              title={evidenceChunks.length > 1 ? `Xem dẫn chứng (${evidenceChunks.length})` : 'Xem dẫn chứng'}
            >
              <TargetIcon className="h-4.5 w-4.5" />
            </button>
          )}
          {explanation?.text && (
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border shadow-sm ${
                showExplanation 
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                  : 'hover:bg-slate-100 text-slate-600 border-slate-100'
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              <span className="text-[11px] font-black uppercase tracking-wider">
                {showExplanation ? 'Đóng' : 'Giải thích'}
              </span>
            </button>
          )}
        </div>

        {showExplanation && explanation?.text && (
          <div className="mt-4 p-5 bg-yellow-50/50 rounded-2xl text-[14px] text-yellow-900 leading-relaxed border border-yellow-100 shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
             {explanation.text.replace(/^Câu\s+\d+\s*[-–—]\s*Giải thích đáp án\s*/i, '')}
          </div>
        )}
      </div>
    );
  }

  // Regular/Exam Mode
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
              } ${isDisabled ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={`question-${questionId}`}
                value={option.id}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => !isDisabled && onAnswer(questionId, option.id)}
                className="h-4 w-4 shrink-0 border-gray-400 text-gray-900 focus:ring-gray-900"
              />
              <span className={`text-sm font-normal leading-5 ${isSelected ? 'font-medium' : ''}`}>
                {option.content}
              </span>
            </label>
          );
        })}
      </div>

      {submitted && (selected.length === 0) && (
        <p className="mt-3 text-xs text-gray-500 italic">Chưa trả lời</p>
      )}
    </div>
  );
}
