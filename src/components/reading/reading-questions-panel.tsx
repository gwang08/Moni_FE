'use client';

import { CheckCircle2 } from 'lucide-react';
import type { StimulusDetail } from '@/types/test.types';

interface Props {
  stimulus: StimulusDetail;
  submitted?: boolean;
  answers: Record<number, number>;
  onAnswer: (questionId: number, optionId: number) => void;
}

export function ReadingQuestionsPanel({ stimulus, submitted = false, answers, onAnswer }: Props) {
  const selectAnswer = (questionId: number, optionId: number) => {
    if (submitted) return;
    onAnswer(questionId, optionId);
  };

  const totalQuestions = stimulus.questionGroups.reduce((sum, g) => sum + g.questions.length, 0);
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      {!submitted && (
        <div className="text-sm text-gray-500">
          Đã trả lời: {answeredCount}/{totalQuestions}
        </div>
      )}

      {stimulus.questionGroups.map((group, gi) => (
        <div key={group.id}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Nhóm {gi + 1}
            </span>
          </div>
          {group.instruction && (
            <p className="text-sm text-gray-600 italic mb-4 bg-gray-50 rounded-lg px-3 py-2">
              {group.instruction}
            </p>
          )}

          <div className="space-y-4">
            {group.questions.map((question) => {
              const selectedId = answers[question.id];
              const showResult = submitted && selectedId != null;

              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    <span className="text-blue-600 font-bold mr-1">{question.position}.</span>
                    {question.content}
                  </p>

                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const isSelected = selectedId === option.id;
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
                      if (submitted) className += ' cursor-default';
                      else className += ' cursor-pointer';

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => selectAnswer(question.id, option.id)}
                          className={className}
                        >
                          {showResult && isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
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

                  {submitted && question.explanation?.text && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <strong>Giải thích:</strong> {question.explanation.text}
                      </p>
                      {question.explanation.evidence && (
                        <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1">
                          Dẫn chứng: &ldquo;{question.explanation.evidence}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {submitted && selectedId == null && (
                    <p className="mt-2 text-xs text-gray-400 italic">Chưa trả lời</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
