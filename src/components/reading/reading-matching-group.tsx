'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import type { QuestionDetail, OptionDetail } from '@/types/test.types';

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface Props {
  questions: QuestionDetail[];
  answers: Record<number, number>;
  submitted: boolean;
  onAnswer: (questionId: number, optionId: number) => void;
  examMode?: boolean;
}

/** Matching group: shows heading pills at top, question slots below. Click pill → click slot to assign. */
export function ReadingMatchingGroup({ questions, answers, submitted, onAnswer, examMode = false }: Props) {
  const [selectedPillId, setSelectedPillId] = useState<number | null>(null);

  // All options are the same across questions in a matching group — take from first question, shuffle
  const allOptions = useMemo(() => {
    const opts = questions[0]?.options || [];
    // Use group's first question ID as seed for consistent shuffle
    return seededShuffle(opts, questions[0]?.id || 0);
  }, [questions]);

  // Track which option IDs are already assigned to some question
  const usedOptionIds = new Set(
    questions.map(q => answers[q.id]).filter((id): id is number => id != null)
  );

  const handlePillClick = (optionId: number) => {
    if (submitted) return;
    setSelectedPillId(prev => (prev === optionId ? null : optionId));
  };

  const handleSlotClick = (questionId: number) => {
    if (submitted || !selectedPillId) return;
    onAnswer(questionId, selectedPillId);
    setSelectedPillId(null);
  };

  const handleClearSlot = (questionId: number) => {
    if (submitted) return;
    // Clear by setting to 0 (no valid option) — parent handles removal
    onAnswer(questionId, 0);
  };

  return (
    <div className="space-y-4">
      {/* Heading pills pool */}
      <div className="flex flex-wrap gap-2">
        {allOptions.map((opt) => {
          const isUsed = usedOptionIds.has(opt.id);
          const isActive = selectedPillId === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handlePillClick(opt.id)}
              disabled={submitted}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                isActive
                  ? examMode
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : isUsed
                    ? 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                    : examMode
                      ? 'bg-white text-gray-900 border-gray-300 hover:border-gray-500 hover:bg-gray-50'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {opt.content}
            </button>
          );
        })}
      </div>

      {selectedPillId && !submitted && (
        <p className={`text-xs animate-pulse ${examMode ? 'text-gray-600' : 'text-blue-600'}`}>Chọn 1 câu hỏi bên dưới để gán heading</p>
      )}

      {/* Question slots */}
      <div className="space-y-3">
        {questions.map((question) => {
          const assignedId = answers[question.id];
          const assignedOpt = question.options.find(o => o.id === assignedId);
          const correctOpt = question.options.find(o => o.isCorrect);
          const isCorrect = assignedOpt?.isCorrect;

          return (
            <div key={question.id} id={`question-${question.id}`} className="border border-gray-300 rounded-lg p-3 bg-white">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm shrink-0 text-gray-900">{question.position}.</span>
                <span className="text-sm font-medium text-gray-900 flex-1">{question.content}</span>
              </div>

              {/* Slot */}
              <div className="mt-2 ml-7">
                {assignedOpt ? (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${
                    submitted
                      ? isCorrect
                        ? 'bg-gray-50 text-gray-900 border-gray-300'
                        : 'bg-gray-50 text-gray-900 border-gray-300'
                      : examMode
                        ? 'bg-gray-50 text-gray-900 border-gray-300'
                        : 'bg-blue-50 text-blue-700 border-blue-300'
                  }`}>
                    <span>{assignedOpt.content}</span>
                    {!submitted && (
                      <button type="button" onClick={() => handleClearSlot(question.id)} className={`hover:opacity-70 ${examMode ? 'text-gray-600' : 'text-blue-400 hover:text-blue-600'}`}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSlotClick(question.id)}
                    disabled={submitted}
                    className={`px-3 py-1.5 rounded-lg border-2 border-dashed text-sm transition-colors ${
                      selectedPillId
                        ? examMode
                          ? 'border-gray-500 bg-gray-50 text-gray-700 cursor-pointer hover:bg-gray-100'
                          : 'border-blue-400 bg-blue-50/50 text-blue-500 cursor-pointer hover:bg-blue-100'
                        : 'border-gray-200 text-gray-400 cursor-default'
                    }`}
                  >
                    {selectedPillId ? 'Gán vào đây' : '— Chưa chọn —'}
                  </button>
                )}
              </div>

              {/* Result after submit */}
              {submitted && correctOpt && assignedId != null && (
                <div className="mt-2 ml-7 flex items-center gap-1.5 text-xs">
                  {isCorrect ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-gray-900" /><span className="text-gray-900 font-medium">Đúng</span></>
                  ) : (
                    <><XCircle className="h-3.5 w-3.5 text-gray-700" /><span className="text-gray-700">Đáp án đúng: <strong>{correctOpt.content}</strong></span></>
                  )}
                </div>
              )}

              {submitted && question.explanation?.text && (
                <div className="mt-2 ml-7 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500"><strong>Giải thích:</strong> {question.explanation.text}</p>
                  {question.explanation.evidence && (
                    <p className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded mt-1">
                      Dẫn chứng: &ldquo;{question.explanation.evidence}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {submitted && assignedId == null && (
                <p className="mt-2 ml-7 text-xs text-gray-400 italic">Chưa trả lời</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
