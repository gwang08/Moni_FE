'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { QuestionDetail } from '@/types/test.types';

interface PassageSegment {
  label: string;
  html: string;
}

function splitPassageByParagraphs(html: string): PassageSegment[] {
  let matches = [...html.matchAll(/Paragraph\s+([A-Z])\b/gi)];
  if (matches.length === 0) {
    matches = [...html.matchAll(/<p[^>]*>\s*(?:<(?:strong|b)>)?\s*([A-Z])\.\s*(?:<\/(?:strong|b)>)?/gi)];
  }
  if (matches.length === 0) return [{ label: '', html }];

  const segments: PassageSegment[] = [];
  if (matches[0].index! > 0) {
    segments.push({ label: '', html: html.slice(0, matches[0].index!) });
  }
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : html.length;
    segments.push({ label: matches[i][1].toUpperCase(), html: html.slice(start, end) });
  }
  return segments;
}

interface Props {
  content: string;
  questions: QuestionDetail[];
  answers: Record<number, number>;
  submitted: boolean;
  onAnswer: (questionId: number, optionId: number) => void;
  selectedPillId: number | null;
  onPillAssigned: () => void;
}

export function ReadingPassageWithMatching({
  content, questions, answers, submitted, onAnswer, selectedPillId, onPillAssigned,
}: Props) {
  const segments = useMemo(() => splitPassageByParagraphs(content), [content]);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const labelToQuestion = useMemo(() => {
    const map: Record<string, QuestionDetail> = {};
    for (const q of questions) {
      const match = q.content.match(/(?:Paragraph\s+)?([A-Z])\b/i);
      if (match) map[match[1].toUpperCase()] = q;
    }
    return map;
  }, [questions]);

  // Pills use questions[0].options. Each question has its own option IDs.
  // We need to translate pill optionId → target question's matching optionId by content.
  const pillOptions = useMemo(() => questions[0]?.options || [], [questions]);

  /** Translate a pill's optionId to the correct optionId for a specific question */
  const translateOptionId = (pillOptionId: number, targetQuestionId: number): number => {
    const pillOpt = pillOptions.find(o => o.id === pillOptionId);
    if (!pillOpt) return pillOptionId;
    const targetQ = questions.find(q => q.id === targetQuestionId);
    if (!targetQ) return pillOptionId;
    const match = targetQ.options.find(o => o.content === pillOpt.content);
    return match ? match.id : pillOptionId;
  };

  const handleSlotClick = (questionId: number) => {
    if (submitted || !selectedPillId) return;
    onAnswer(questionId, translateOptionId(selectedPillId, questionId));
    onPillAssigned();
  };

  const handleClear = (questionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (submitted) return;
    onAnswer(questionId, 0);
  };

  /* Drag-and-drop via event delegation on wrapper */
  const handleWrapperDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const zone = (e.target as HTMLElement).closest('[data-question-id]');
    setDragOverId(zone ? Number(zone.getAttribute('data-question-id')) : null);
  };

  const handleWrapperDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
    const zone = (e.target as HTMLElement).closest('[data-question-id]');
    if (!zone) return;
    const questionId = Number(zone.getAttribute('data-question-id'));
    const pillOptionId = Number(e.dataTransfer.getData('text/plain'));
    if (questionId && pillOptionId) onAnswer(questionId, translateOptionId(pillOptionId, questionId));
  };

  const handleWrapperDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) setDragOverId(null);
  };

  return (
    <div
      className="prose max-w-none leading-relaxed text-lg"
      onDragOver={handleWrapperDragOver}
      onDrop={handleWrapperDrop}
      onDragLeave={handleWrapperDragLeave}
    >
      {segments.map((seg, i) => {
        const question = seg.label ? labelToQuestion[seg.label] : null;
        const assignedId = question ? answers[question.id] : undefined;
        // answers now stores the target question's own option ID
        const assignedOpt = assignedId ? question?.options.find(o => o.id === assignedId) : undefined;
        const correctOpt = question?.options.find(o => o.isCorrect);
        const isCorrect = assignedOpt?.isCorrect ?? false;
        const isDragOver = question && dragOverId === question.id;

        return (
          <div key={i}>
            {question && (
              <div
                className="mb-3 mt-5 not-prose"
                data-question-id={question.id}
                onClick={() => handleSlotClick(question.id)}
              >
                {assignedOpt ? (
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm ${
                    submitted
                      ? isCorrect ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-blue-50 border-blue-300 text-blue-700'
                  }`}>
                    <span className="font-semibold text-xs text-gray-400 shrink-0">Q{question.position}</span>
                    <span className="flex-1">{assignedOpt.content}</span>
                    {!submitted && (
                      <button type="button" onClick={(e) => handleClear(question.id, e)} className="text-blue-400 hover:text-blue-600 text-xs font-bold">✕</button>
                    )}
                    {submitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                    {submitted && !isCorrect && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                  </div>
                ) : (
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed text-sm transition-colors cursor-pointer ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-100/50 text-blue-600'
                      : selectedPillId
                        ? 'border-blue-400 bg-blue-50/50 text-blue-500 hover:bg-blue-100'
                        : submitted
                          ? 'border-gray-200 text-gray-400 cursor-default'
                          : 'border-gray-300 bg-gray-50/50 text-gray-400'
                  }`}>
                    <span className="font-semibold text-xs text-gray-400 shrink-0">Q{question.position}</span>
                    <span className="flex-1 italic">
                      {submitted ? 'Chưa trả lời' : selectedPillId ? 'Click để gán heading' : 'Chọn heading bên phải →'}
                    </span>
                  </div>
                )}

                {submitted && assignedId != null && !isCorrect && correctOpt && (
                  <p className="text-xs text-red-600 mt-1 ml-8">Đáp án đúng: <strong>{correctOpt.content}</strong></p>
                )}
                {submitted && assignedId == null && correctOpt && (
                  <p className="text-xs text-gray-400 mt-1 ml-8 italic">Đáp án: <strong>{correctOpt.content}</strong></p>
                )}
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: seg.html }} />
          </div>
        );
      })}
    </div>
  );
}
