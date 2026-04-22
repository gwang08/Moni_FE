'use client';

import { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { QuestionDetail } from '@/types/test.types';

interface Props {
  questions: QuestionDetail[];
  answers: Record<number, number>;
  submitted: boolean;
  readOnly?: boolean;
  onAnswer: (questionId: number, optionId: number) => void;
  examMode?: boolean;
  questionPositionById?: Record<number, number>;
}

export function ListeningMatchingInformation({ 
  questions, 
  answers, 
  submitted, 
  readOnly = false,
  onAnswer, 
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
                  <td className="py-3 px-1 pr-3 text-sm text-gray-900">{q.content}</td>
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
                  {q.explanation?.text && (
                    <p className="text-gray-500 mt-1"><strong>Giải thích:</strong> {q.explanation.text}</p>
                  )}
                  {q.explanation?.evidence && (
                    <p className="text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1">
                      Dẫn chứng: &ldquo;{q.explanation.evidence}&rdquo;
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
