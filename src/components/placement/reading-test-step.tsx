'use client';

import { ReadingExamView } from '@/components/reading/reading-exam-view';
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

export function ReadingTestStep({
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
  return (
    <ReadingExamView
      stimuli={testDetail.stimuli}
      answers={answers}
      textAnswers={textAnswers}
      onAnswer={onAnswer}
      onTextAnswer={onTextAnswer}
      onSubmit={onComplete}
      isSubmitting={isSubmitting}
      submitted={false}
      readOnly={readOnly}
      elapsedTime={elapsedTime}
    />
  );
}
