'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { StimulusDetail } from '@/types/test.types';

const GAP_TYPES = ['GAP_FILLING', 'DIAGRAM_LABEL'];

interface Props {
  stimulus: StimulusDetail;
  answers: Record<number, number>;
  textAnswers?: Record<number, string>;
  onLocateEvidence: (evidence: string) => void;
}

/** Review panel showing each question with user answer, correct answer, and explanation */
export function ReadingReviewPanel({ stimulus, answers, textAnswers = {}, onLocateEvidence }: Props) {
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Collect all questions flat for bottom nav
  const allQuestions = stimulus.questionGroups.flatMap(g => g.questions);

  const scrollToQuestion = (questionId: number) => {
    questionRefs.current[questionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                const isGap = GAP_TYPES.includes(group.questionTypeCode || '');
                const correctOption = question.options.find(o => o.isCorrect);
                const correctAnswer = correctOption?.content ?? '';

                // Gap-type: use text answer
                const userText = isGap ? (textAnswers[question.id] ?? '').trim() : null;
                const isGapCorrect = isGap && userText
                  ? userText.toLowerCase() === correctAnswer.trim().toLowerCase()
                  : false;
                const isGapSkipped = isGap && !userText;

                // Option-type: use option answer
                const selectedId = !isGap ? answers[question.id] : undefined;
                const selectedOption = selectedId != null ? question.options.find(o => o.id === selectedId) : null;
                const isOptionCorrect = selectedOption?.isCorrect === true;
                const isOptionSkipped = !isGap && selectedId == null;

                const isCorrect = isGap ? isGapCorrect : isOptionCorrect;
                const isSkipped = isGap ? isGapSkipped : isOptionSkipped;

                return (
                  <div
                    key={question.id}
                    ref={el => { questionRefs.current[question.id] = el; }}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    {/* Question header */}
                    <p className="text-sm font-medium text-gray-800">
                      <span className="text-blue-600 font-bold mr-1">{question.position}.</span>
                      {question.content}
                    </p>

                    {/* User's answer badge */}
                    <div className="flex flex-wrap gap-2 items-center text-sm">
                      <span className="text-gray-500">Bạn trả lời:</span>
                      {isSkipped ? (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">Bỏ qua</span>
                      ) : isGap ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          isGapCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {userText}
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          isOptionCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedOption?.label && `${selectedOption.label}. `}{selectedOption?.content}
                        </span>
                      )}
                    </div>

                    {/* Correct answer */}
                    {!isCorrect && correctOption && (
                      <div className="text-sm flex gap-2 items-center">
                        <span className="text-gray-500">Đáp án:</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          {!isGap && correctOption.label && `${correctOption.label}. `}{correctOption.content}
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {question.explanation?.evidence && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onLocateEvidence(question.explanation!.evidence!)}
                        >
                          Vị trí trong bài
                        </Button>
                      )}

                      {question.explanation?.text && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Xem giải thích</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Giải thích câu {question.position}</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm leading-relaxed">{question.explanation.text}</p>
                            {question.explanation.evidence && (
                              <p className="bg-amber-50 p-3 rounded border-l-4 border-amber-400 mt-3 text-sm text-amber-800">
                                Dẫn chứng: &ldquo;{question.explanation.evidence}&rdquo;
                              </p>
                            )}
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom navigation bar */}
      <div className="border-t bg-white px-4 py-3 flex flex-wrap gap-2">
        {allQuestions.map((q) => {
          // Determine group type for this question
          const group = stimulus.questionGroups.find(g => g.questions.some(gq => gq.id === q.id));
          const isGap = GAP_TYPES.includes(group?.questionTypeCode || '');

          let isCorrect: boolean;
          let isSkipped: boolean;
          if (isGap) {
            const userText = (textAnswers[q.id] ?? '').trim();
            const correctAnswer = (q.options.find(o => o.isCorrect)?.content ?? '').trim();
            isSkipped = !userText;
            isCorrect = !isSkipped && userText.toLowerCase() === correctAnswer.toLowerCase();
          } else {
            const selectedId = answers[q.id];
            isSkipped = selectedId == null;
            isCorrect = !isSkipped && (q.options.find(o => o.id === selectedId)?.isCorrect ?? false);
          }

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => scrollToQuestion(q.id)}
              className={`w-7 h-7 rounded-full text-xs font-semibold border transition-colors ${
                isSkipped
                  ? 'bg-gray-100 border-gray-300 text-gray-500'
                  : isCorrect
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : 'bg-red-100 border-red-400 text-red-700'
              }`}
            >
              {q.position}
            </button>
          );
        })}
      </div>
    </div>
  );
}
