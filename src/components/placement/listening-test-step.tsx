'use client';

import { ListeningExamView } from '@/components/listening/listening-exam-view';
import { useListeningStore } from '@/store/listening-store';
import type { TestDetailResponse } from '@/types/test.types';

interface Props {
  testDetail: TestDetailResponse;
  answers: Record<number, number>;
  textAnswers: Record<number, string>;
  onAnswer: (questionId: number, optionId: number) => void;
  onTextAnswer: (questionId: number, text: string) => void;
  onComplete: () => void;
  isSubmitting?: boolean;
  readOnly?: boolean;
  elapsedTime?: string;
}

export function ListeningTestStep({
  testDetail,
  answers,
  textAnswers,
  onAnswer,
  onTextAnswer,
  onComplete,
  isSubmitting = false,
  readOnly = false,
  elapsedTime,
}: Props) {
  const isPlaying = useListeningStore((s) => s.isPlaying);

  return (
    <ListeningExamView
      stimuli={testDetail.stimuli}
      answers={answers}
      textAnswers={textAnswers}
      onAnswer={onAnswer}
      onTextAnswer={onTextAnswer}
      onSubmit={onComplete}
      isSubmitting={isSubmitting}
      submitted={false}
      readOnly={readOnly}
      isPlaying={isPlaying}
      elapsedTime={elapsedTime}
    />
  );
}
