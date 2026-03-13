'use client';

import { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { QuestionDetail } from '@/types/test.types';

interface Props {
  questions: QuestionDetail[];
  answers: Record<number, number>;
  submitted: boolean;
  onAnswer: (questionId: number, optionId: number) => void;
}

export function ReadingMatchingFeature({ questions, answers, submitted, onAnswer }: Props) {
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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">List of categories</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {categories.map(c => (
            <div key={c.label} className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-blue-600 shrink-0">{c.label}</span>
              <span className="text-sm text-gray-700">{c.content}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 italic">NB You may use any letter more than once.</p>

      {/* Desktop: table layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 px-2 w-8" />
              <th className="text-left py-2 px-2" />
              {categories.map(c => (
                <th key={c.label} className="text-center py-2 px-2 w-10 font-bold text-gray-700">
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
              const correctOpt = q.options.find(o => o.isCorrect);
              const isCorrect = selectedOpt?.isCorrect;

              return (
                <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-3 px-2">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                      {q.position}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-800">{q.content}</td>
                  {categories.map(c => {
                    const opt = q.options.find(o => o.label === c.label);
                    if (!opt) return <td key={c.label} className="text-center py-3 px-2" />;
                    const isSelected = selectedOptId === opt.id;
                    const isThisCorrect = opt.isCorrect;

                    return (
                      <td key={c.label} className="text-center py-3 px-2">
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
                                ? 'border-green-500 bg-green-500'
                                : isSelected && !isThisCorrect
                                  ? 'border-red-500 bg-red-500'
                                  : isThisCorrect
                                    ? 'border-green-500 bg-green-100'
                                    : 'border-gray-200'
                              : isSelected
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-gray-300 hover:border-blue-400'
                            }
                          `}>
                            {(isSelected || (submitted && isThisCorrect)) && (
                              <span className={`h-2 w-2 rounded-full ${
                                submitted
                                  ? isSelected && isThisCorrect ? 'bg-white'
                                    : isSelected ? 'bg-white'
                                    : isThisCorrect ? 'bg-green-500' : ''
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
                          : <XCircle className="h-4 w-4 text-red-500" />
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
        {questions.map(q => {
          const selectedOptId = answers[q.id];
          const selectedOpt = q.options.find(o => o.id === selectedOptId);
          const correctOpt = q.options.find(o => o.isCorrect);
          const isCorrect = selectedOpt?.isCorrect;

          return (
            <div key={q.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-50 text-green-700 text-xs font-bold shrink-0">
                  {q.position}
                </span>
                <span className="text-sm text-gray-800">{q.content}</span>
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
                      onClick={() => !submitted && onAnswer(q.id, opt.id)}
                      disabled={submitted}
                      className={`
                        h-8 w-8 rounded-lg border-2 text-xs font-bold transition-all
                        ${submitted
                          ? isSelected && isThisCorrect ? 'border-green-500 bg-green-500 text-white'
                            : isSelected ? 'border-red-500 bg-red-500 text-white'
                            : isThisCorrect ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-400'
                          : isSelected ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 text-gray-600 hover:border-blue-400'
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

      {/* Explanations after submit — desktop */}
      {submitted && (
        <div className="hidden sm:block space-y-2 pt-2 border-t border-gray-100">
          {questions.map(q => {
            if (!q.explanation?.text && !q.explanation?.evidence) return null;
            return (
              <div key={q.id} className="text-xs">
                <span className="font-medium text-gray-600">Q{q.position}:</span>
                {q.explanation?.text && <span className="text-gray-500 ml-1">{q.explanation.text}</span>}
                {q.explanation?.evidence && (
                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded ml-1">
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
