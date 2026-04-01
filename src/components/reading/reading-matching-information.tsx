'use client';

import { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { QuestionDetail } from '@/types/test.types';

interface Props {
  questions: QuestionDetail[];
  answers: Record<number, number>;
  submitted: boolean;
  onAnswer: (questionId: number, optionId: number) => void;
  examMode?: boolean;
}

export function ReadingMatchingInformation({ questions, answers, submitted, onAnswer, examMode = false }: Props) {
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
    <div className="space-y-3">
      <p className={`text-xs italic ${examMode ? 'text-gray-600' : 'text-gray-500'}`}>NB You may use any letter more than once.</p>

      {/* Desktop: table layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 px-2 w-8" />
              <th className="text-left py-2 px-2" />
              {paraLabels.map(label => (
                <th key={label} className="text-center py-2 px-2 w-10 font-bold text-gray-900">
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
              const correctOpt = q.options.find(o => o.isCorrect);
              const isCorrect = selectedOpt?.isCorrect;

              return (
                <tr key={q.id} id={`question-${q.id}`} className="border-b border-gray-200 hover:bg-gray-50/50">
                  <td className="py-3 px-2">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-900 text-xs font-bold">
                      {q.position}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-900">{q.content}</td>
                  {paraLabels.map(label => {
                    const opt = q.options.find(o => o.label === label);
                    if (!opt) return <td key={label} className="text-center py-3 px-2" />;
                    const isSelected = selectedOptId === opt.id;
                    const isThisCorrect = opt.isCorrect;

                    return (
                      <td key={label} className="text-center py-3 px-2">
                        <button
                          type="button"
                          onClick={() => !submitted && onAnswer(q.id, opt.id)}
                          disabled={submitted}
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
                                submitted
                                  ? 'bg-white'
                                  : 'bg-white'
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
          const correctOpt = q.options.find(o => o.isCorrect);
          const isCorrect = selectedOpt?.isCorrect;

          return (
            <div key={q.id} id={`question-${q.id}-mobile`} className="border border-gray-300 rounded-lg p-3 space-y-2 bg-white">
              <div className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-900 text-xs font-bold shrink-0">
                  {q.position}
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
                      onClick={() => !submitted && onAnswer(q.id, opt.id)}
                      disabled={submitted}
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
                      {label}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className="ml-8 text-xs">
                  {selectedOptId != null ? (
                    isCorrect
                      ? <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Correct</span>
                      : <span className="text-red-600 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Answer: <strong>{correctOpt?.label}</strong></span>
                  ) : (
                    <span className="text-gray-400 italic">Not answered</span>
                  )}
                  {q.explanation?.text && (
                    <p className="text-gray-500 mt-1"><strong>Explanation:</strong> {q.explanation.text}</p>
                  )}
                  {q.explanation?.evidence && (
                    <p className="text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1">
                      Evidence: &ldquo;{q.explanation.evidence}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation after submit — desktop */}
      {submitted && (
        <div className="hidden sm:block space-y-2 pt-2 border-t border-gray-200">
          {questions.map(q => {
            if (!q.explanation?.text && !q.explanation?.evidence) return null;
            return (
              <div key={q.id} className="text-xs">
                <span className="font-medium text-gray-700">Q{q.position}:</span>
                {q.explanation?.text && <span className="text-gray-600 ml-1">{q.explanation.text}</span>}
                {q.explanation?.evidence && (
                  <span className="text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded ml-1">
                    &ldquo;{q.explanation.evidence}&rdquo;
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
