'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import type { QuestionDetail } from '@/types/test.types';

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
  questions: QuestionDetail[];
  answers: Record<number, number>;
  submitted: boolean;
  readOnly?: boolean;
  onAnswer: (questionId: number, optionId: number) => void;
  onLocateEvidence?: (evidence: string, offset?: number, startOffset?: number, endOffset?: number, startTime?: number) => void;
  examMode?: boolean;
  questionPositionById?: Record<number, number>;
}

export function ListeningMatchingInformation({ 
  questions, 
  answers, 
  submitted, 
  readOnly = false,
  onAnswer, 
  onLocateEvidence,
  examMode = false, 
  questionPositionById = {} 
}: Props) {
  const isDisabled = submitted || readOnly;

  // Extract unique paragraph labels from options (A, B, C, D...)
  const paraLabels = useMemo(() => {
    const labels = new Set<string>();
    for (const q of questions) {
      for (const o of q.options) {
        if (o.label) labels.add(o.label);
      }
    }
    return [...labels].sort();
  }, [questions]);

  return (
    <div className="space-y-2">
      {/* Desktop: table layout */}
      <div className="hidden sm:block overflow-x-auto -mx-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 px-1 w-8" />
              <th className="text-left py-2 px-1" />
              {paraLabels.map(label => (
                <th key={label} className="text-center py-2 px-1 w-10 font-bold text-gray-900">
                  {label}
                </th>
              ))}
              {submitted && <th className="w-20" />}
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const selectedOptId = answers[q.id];
              const selectedOpt = q.options.find(o => o.id === selectedOptId);
              const isCorrect = selectedOpt?.isCorrect;

              return (
                <tr key={q.id} id={`question-${q.id}`} className="border-b border-gray-200 hover:bg-gray-50/50">
                  <td className="py-3 px-1">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-900 text-xs font-bold">
                      {questionPositionById[q.id] ?? q.position}
                    </span>
                  </td>
                  <td className="py-3 px-1 pr-3 text-sm text-gray-900">
                    <div>{q.content}</div>
                    {submitted && q.explanation && (q.explanation.text || q.explanation.evidence) && (
                      <ExplanationSection explanation={q.explanation} onLocateEvidence={onLocateEvidence} />
                    )}
                  </td>
                  {paraLabels.map(label => {
                    const opt = q.options.find(o => o.label === label);
                    if (!opt) return <td key={label} className="text-center py-3 px-1" />;
                    const isSelected = selectedOptId === opt.id;
                    const isThisCorrect = opt.isCorrect;

                    return (
                      <td key={label} className="text-center py-3 px-1">
                        <button
                          type="button"
                          onClick={() => !isDisabled && onAnswer(q.id, opt.id)}
                          disabled={isDisabled}
                          className="inline-flex items-center justify-center"
                        >
                          <span className={`
                            inline-flex items-center justify-center h-5 w-5 rounded-full border-2 transition-all
                            ${submitted
                              ? isSelected && isThisCorrect
                                ? 'border-blue-600 bg-blue-600'
                                : isSelected && !isThisCorrect
                                  ? 'border-blue-500 bg-blue-500'
                                  : isThisCorrect
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200'
                              : isSelected
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-gray-300 hover:border-gray-500'
                            }
                          `}>
                            {(isSelected || (submitted && isThisCorrect)) && <span className="h-2 w-2 rounded-full bg-white" />}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                  {submitted && (
                    <td className="py-3 px-2">
                      {selectedOptId != null ? (
                        isCorrect
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <XCircle className="h-4 w-4 text-gray-700" />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: card layout */}
      <div className="sm:hidden space-y-3">
        {questions.map((q) => {
          const selectedOptId = answers[q.id];
          const selectedOpt = q.options.find(o => o.id === selectedOptId);
          const isCorrect = selectedOpt?.isCorrect;

          return (
            <div key={q.id} id={`question-${q.id}-mobile`} className="border border-gray-300 rounded-lg p-3 space-y-2 bg-white">
              <div className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-900 text-xs font-bold shrink-0">
                  {questionPositionById[q.id] ?? q.position}
                </span>
                <span className="text-sm text-gray-900">{q.content}</span>
              </div>
              <div className="flex flex-wrap gap-2 ml-8">
                {paraLabels.map(label => {
                  const opt = q.options.find(o => o.label === label);
                  if (!opt) return null;
                  const isSelected = selectedOptId === opt.id;
                  const isThisCorrect = opt.isCorrect;

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => !isDisabled && onAnswer(q.id, opt.id)}
                      disabled={isDisabled}
                      className={`
                        h-8 w-8 rounded-lg border-2 text-xs font-bold transition-all
                        ${submitted
                          ? isSelected && isThisCorrect ? 'border-blue-600 bg-blue-600 text-white'
                            : isSelected ? 'border-blue-500 bg-blue-500 text-white'
                            : isThisCorrect ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-400'
                          : isSelected ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 text-gray-700 hover:border-gray-500'
                        }
                      `}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className="ml-8 text-xs">
                  {selectedOptId != null ? (
                    isCorrect
                      ? <span className="text-blue-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Đúng</span>
                      : <span className="text-blue-600 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Đáp án: <strong>{q.options.find(o => o.isCorrect)?.label}</strong></span>
                  ) : (
                    <span className="text-gray-400 italic">Chưa trả lời</span>
                  )}
                  {q.explanation && (q.explanation.text || q.explanation.evidence) && (
                    <ExplanationSection explanation={q.explanation} onLocateEvidence={onLocateEvidence} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Reusable explanation section with toggleable explanation text */
function ExplanationSection({ explanation, onLocateEvidence }: {
  explanation: { 
    text?: string; 
    evidence?: string;
    offsets?: number[];
    startOffsets?: number[];
    endOffsets?: number[];
    startTimes?: number[];
  };
  onLocateEvidence?: (evidence: string, offset?: number, startOffset?: number, endOffset?: number, startTime?: number) => void;
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Remove "Câu X - Giải thích đáp án" prefix from explanation text
  const cleanExplanation = explanation.text?.replace(/^Câu\s+\d+\s*[-–—]\s*Giải thích đáp án\s*/i, '') || explanation.text;

  const evidenceChunks = explanation.evidence?.split('\n---\n').filter((e: string) => e.trim()) || [];
  const offsets = explanation.offsets || [];
  const startOffsets = explanation.startOffsets || [];
  const endOffsets = explanation.endOffsets || [];
  const startTimes = explanation.startTimes || [];

  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <div className="flex items-center gap-2">
        {evidenceChunks.length > 0 && onLocateEvidence && (
          <div className="flex gap-1">
            {evidenceChunks.map((chunk, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLocateEvidence?.(chunk.trim(), offsets[i], startOffsets[i], endOffsets[i], startTimes[i]);
                }}
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowExplanation(!showExplanation);
            }}
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
        <div className="mt-2 text-[13px] text-gray-700 bg-gray-50 rounded px-3 py-2 w-full">
          {cleanExplanation}
        </div>
      )}
    </div>
  );
}
