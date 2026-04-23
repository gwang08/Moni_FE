'use client';

import { useCallback, useMemo } from 'react';
import { ReadingPassage } from '@/components/reading/reading-passage';
import { formatReadingPassage } from '@/lib/format-reading-passage';
import type { QuestionDetail } from '@/types/test.types';

interface Props {
  content: string;
  stimulusId: number;
  questions: QuestionDetail[];
  answers: Record<number, number>;
  submitted: boolean;
  onAnswer: (questionId: number, optionId: number) => void;
  selectedPillId: number | null;
  onPillAssigned: () => void;
  examMode?: boolean;
  questionPositionById?: Record<number, number>;
}

function getParagraphLabel(text: string): string | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const explicit = normalized.match(/^Paragraph\s+([A-Z])\b/i);
  if (explicit) return explicit[1].toUpperCase();

  const letter = normalized.match(/^([A-Z])(?:\s*\.|\s)\s+/);
  if (letter) return letter[1].toUpperCase();

  return null;
}

function buildMatchingContent(
  content: string,
  questions: QuestionDetail[],
  answers: Record<number, number>,
  submitted: boolean,
  questionPositionById: Record<number, number> = {},
) {
  const formatted = formatReadingPassage(content);
  if (!formatted.trim()) return formatted;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${formatted}</body>`, 'text/html');
  const body = doc.body;
  const blocks = Array.from(body.children).filter((el): el is HTMLElement => {
    const text = el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    return text.length > 0;
  });

  const questionByLabel: Record<string, QuestionDetail> = {};
  for (const q of questions) {
    const match = q.content.match(/(?:Paragraph\s+)?([A-Z])\b/i);
    if (match) questionByLabel[match[1].toUpperCase()] = q;
  }

  blocks.forEach((block, index) => {
    const label = getParagraphLabel(block.textContent || '') ?? String.fromCharCode(65 + index);
    const question = questionByLabel[label] ?? questions[index];
    if (!question) return;

    const assignedId = answers[question.id];
    const assignedOpt = assignedId ? question.options.find((o) => o.id === assignedId) : undefined;
    const correctOpt = question.options.find((o) => o.isCorrect);
    const isCorrect = assignedOpt?.isCorrect ?? false;
    const displayPosition = questionPositionById[question.id] ?? question.position;
    const state = submitted
      ? assignedOpt
        ? isCorrect
          ? 'submitted-correct'
          : 'submitted-wrong'
        : 'empty'
      : assignedOpt
        ? 'filled'
        : 'empty';

    const existingSlot = block.querySelector('[data-matching-slot]');
    if (existingSlot) existingSlot.remove();

    const slot = doc.createElement('span');
    slot.setAttribute('data-matching-slot', '1');
    slot.setAttribute('data-question-id', String(question.id));
    slot.setAttribute('data-question-position', String(displayPosition));
    slot.setAttribute('data-label', String(displayPosition));
    slot.setAttribute('data-answer', assignedOpt?.content || '');
    slot.setAttribute('data-state', state);
    slot.setAttribute('contenteditable', 'false');
    block.insertBefore(slot, block.firstChild);

    if (submitted && assignedOpt && !isCorrect && correctOpt) {
      block.setAttribute('data-correct-answer', correctOpt.content);
    } else {
      block.removeAttribute('data-correct-answer');
    }
  });

  return body.innerHTML;
}

export function ReadingPassageWithMatching({
  content,
  stimulusId,
  questions,
  answers,
  submitted,
  onAnswer,
  selectedPillId,
  onPillAssigned,
  examMode = false,
  questionPositionById = {},
}: Props) {
  const contentWithSlots = useMemo(
    () => buildMatchingContent(content, questions, answers, submitted, questionPositionById),
    [answers, content, questionPositionById, questions, submitted]
  );

  const pillOptions = useMemo(() => questions[0]?.options || [], [questions]);

  const translateOptionId = useCallback((pillOptionId: number, targetQuestionId: number): number => {
    const pillOpt = pillOptions.find((o) => o.id === pillOptionId);
    if (!pillOpt) return pillOptionId;
    const targetQ = questions.find((q) => q.id === targetQuestionId);
    if (!targetQ) return pillOptionId;
    const match = targetQ.options.find((o) => o.content === pillOpt.content);
    return match ? match.id : pillOptionId;
  }, [pillOptions, questions]);

  const resolveQuestionId = useCallback((target: HTMLElement) => {
    const slot = target.closest('[data-matching-slot]') as HTMLElement | null;
    if (!slot) return null;
    const id = Number(slot.getAttribute('data-question-id'));
    return Number.isFinite(id) ? id : null;
  }, []);

  const handleClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const questionId = resolveQuestionId(target);
    if (!questionId) return;

    e.preventDefault();
    e.stopPropagation();

    const clear = target.closest('[data-clear-matching-answer]') as HTMLElement | null;
    if (clear) {
      if (!submitted) onAnswer(questionId, 0);
      return;
    }

    if (submitted || !selectedPillId) return;
    onAnswer(questionId, translateOptionId(selectedPillId, questionId));
    onPillAssigned();
  }, [onAnswer, onPillAssigned, resolveQuestionId, selectedPillId, submitted, translateOptionId]);

  const handleDropCapture = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const questionId = resolveQuestionId(target);
    if (!questionId || submitted) return;

    const pillOptionId = Number(e.dataTransfer.getData('text/plain'));
    if (!pillOptionId) return;

    e.preventDefault();
    e.stopPropagation();
    onAnswer(questionId, translateOptionId(pillOptionId, questionId));
    onPillAssigned();
  }, [onAnswer, onPillAssigned, resolveQuestionId, submitted, translateOptionId]);

  const handleDragOverCapture = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (resolveQuestionId(target)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }, [resolveQuestionId]);

  return (
    <div onClickCapture={handleClickCapture} onDragOverCapture={handleDragOverCapture} onDropCapture={handleDropCapture}>
      <ReadingPassage content={contentWithSlots} stimulusId={stimulusId} interactive examMode={examMode} />
    </div>
  );
}
