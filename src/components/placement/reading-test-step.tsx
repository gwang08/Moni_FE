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
}

export function ReadingTestStep({ testDetail, answers, textAnswers, onAnswer, onTextAnswer, onComplete }: Props) {
  return (
    <ReadingExamView
      stimuli={testDetail.stimuli}
      answers={answers}
      textAnswers={textAnswers}
      onAnswer={onAnswer}
      onTextAnswer={onTextAnswer}
      onSubmit={onComplete}
      submitted={false}
    />
  );
}
