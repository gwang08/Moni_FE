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

export function ListeningMatchingFeature({ 
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

  // Extract unique categories from options (A → "Howard Gardner", B → "Sternberg", etc.)
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questions) {
      for (const o of q.options) {
        if (o.label && !map.has(o.label)) map.set(o.label, o.content);
      }
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, content]) => ({ label, content }));
  }, [questions]);

  return (
    <div className="space-y-4">
      {/* Category list */}
      <div className={`border rounded-lg p-3 ${examMode ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'}`}>
        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">List of categories</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {categories.map(c => (
            <div key={c.label} className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-gray-900 shrink-0">{c.label}</span>
              <span className="text-sm text-gray-800">{c.content}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-600 italic">NB You may use any letter more than once.</p>

      {/* Desktop: table layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 px-2 w-8" />
              <th className="text-left py-2 px-2" />
              {categories.map(c => (
                <th key={c.label} className="text-center py-2 px-2 w-10 font-bold text-gray-900">
                  {c.label}
                </th>
              ))}
              {submitted && <th className="w-20" />}
            </tr>
          </thead>
          <tbody>
            {questions.map(q => {
              const selectedOptId = answers[q.id];
              const selectedOpt = q.options.find(o => o.id === selectedOptId);
              const isCorrect = selectedOpt?.isCorrect;

              return (
                <tr key={q.id} id={`question-${q.id}`} className="border-b border-gray-200 hover:bg-gray-50/50">
                  <td className="py-3 px-2">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-900 text-xs font-bold">
                      {questionPositionById[q.id] ?? q.position}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-900">
                    <div>{q.content}</div>
                    {submitted && q.explanation && (q.explanation.text || q.explanation.evidence) && (
                      <ExplanationSection explanation={q.explanation} onLocateEvidence={onLocateEvidence} />
                    )}
                  </td>
                  {categories.map(c => {
                    const opt = q.options.find(o => o.label === c.label);
                    if (!opt) return <td key={c.label} className="text-center py-3 px-2" />;
                    const isSelected = selectedOptId === opt.id;
                    const isThisCorrect = opt.isCorrect;

                    return (
                      <td key={c.label} className="text-center py-3 px-2">
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
                                ? 'border-gray-900 bg-gray-900'
                                : isSelected && !isThisCorrect
                                  ? 'border-gray-700 bg-gray-700'
                                  : isThisCorrect
                                    ? 'border-gray-900 bg-gray-100'
                                    : 'border-gray-200'
                              : isSelected
                                ? 'border-gray-900 bg-gray-900'
                                : 'border-gray-300 hover:border-gray-500'
                            }
                          `}>
                            {(isSelected || (submitted && isThisCorrect)) && (
                              <span className={`h-2 w-2 rounded-full ${
                                'bg-white'
                              }`} />
                            )}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                  {submitted && (
                    <td className="py-3 px-2">
                      {selectedOptId != null ? (
                        isCorrect
                          ? <CheckCircle2 className="h-4 w-4 text-gray-900" />
                          : <XCircle className="h-4 w-4 text-gray-700" />
                      ) : (
                        <span className="text-xs text-gray-400">â€”</span>
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
        {questions.map(q => {
          const selectedOptId = answers[q.id];
          const selectedOpt = q.options.find(o => o.id === selectedOptId);
          const correctOpt = q.options.find(o => o.isCorrect);
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
                {categories.map(c => {
                  const opt = q.options.find(o => o.label === c.label);
                  if (!opt) return null;
                  const isSelected = selectedOptId === opt.id;
                  const isThisCorrect = opt.isCorrect;

                  return (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => !isDisabled && onAnswer(q.id, opt.id)}
                      disabled={isDisabled}
                      className={`
                        h-8 w-8 rounded-lg border-2 text-xs font-bold transition-all
                        ${submitted
                          ? isSelected && isThisCorrect ? 'border-gray-900 bg-gray-900 text-white'
                            : isSelected ? 'border-gray-700 bg-gray-700 text-white'
                            : isThisCorrect ? 'border-gray-900 bg-gray-100 text-gray-900'
                            : 'border-gray-200 text-gray-400'
                          : isSelected ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-300 text-gray-700 hover:border-gray-500'
                        }
                      `}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className="ml-8 text-xs">
                  {selectedOptId != null ? (
                    isCorrect
                      ? <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Đúng</span>
                      : <span className="text-red-600 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Đáp án: <strong>{correctOpt?.label}</strong></span>
                  ) : (
                    <span className="text-gray-400 italic">Chưa trả lời</span>
                  )}
                  {q.explanation?.text && (
                    <p className="text-gray-500 mt-1"><strong>Giải thích:</strong> {q.explanation.text}</p>
                  )}
                  {q.explanation?.evidence && (
                    <p className="text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1">
                      Dáº«n chá»©ng: &ldquo;{q.explanation.evidence}&rdquo;
                    </p>
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
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLocateEvidence?.(explanation.evidence?.trim() || '', offsets[0], startOffsets[0], endOffsets[0], startTimes[0]);
            }}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
            title={evidenceChunks.length > 1 ? `Xem dẫn chứng (${evidenceChunks.length})` : 'Xem dẫn chứng'}
          >
            <TargetIcon className="h-4 w-4 text-gray-900" strokeWidth={2} />
          </button>
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

