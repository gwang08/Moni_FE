'use client';

import { useMemo } from 'react';
import type { StimulusDetail, OptionDetail } from '@/types/test.types';
import { ReadingQuestionMcq } from '@/components/reading/reading-question-mcq';
import { ReadingMatchingGroup } from '@/components/reading/reading-matching-group';
import { ReadingMatchingInformation } from '@/components/reading/reading-matching-information';
import { ReadingMatchingPills } from '@/components/reading/reading-matching-pills';
import { ReadingGapFilling } from '@/components/reading/reading-gap-filling';

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

const NO_SHUFFLE_TYPES = ['TFNG', 'YNNG', 'GAP_FILLING', 'DIAGRAM_LABEL'];
const MATCHING_TYPES = ['MATCHING_HEADINGS', 'MATCHING_INFORMATION', 'MATCHING_FEATURE'];
const GAP_TYPES = ['GAP_FILLING', 'DIAGRAM_LABEL'];

interface Props {
  stimulus: StimulusDetail;
  submitted?: boolean;
  answers: Record<number, number>;
  onAnswer: (questionId: number, optionId: number) => void;
  textAnswers?: Record<number, string>;
  onTextAnswer?: (questionId: number, text: string) => void;
  selectedPillId?: number | null;
  onPillSelect?: (id: number | null) => void;
}

export function ReadingQuestionsPanel({ stimulus, submitted = false, answers, onAnswer, textAnswers = {}, onTextAnswer, selectedPillId = null, onPillSelect }: Props) {
  const selectAnswer = (questionId: number, optionId: number) => {
    if (submitted) return;
    onAnswer(questionId, optionId);
  };

  const shuffledOptionsMap = useMemo(() => {
    const map: Record<number, OptionDetail[]> = {};
    for (const group of stimulus.questionGroups) {
      const typeCode = group.questionTypeCode || '';
      if (MATCHING_TYPES.includes(typeCode) || GAP_TYPES.includes(typeCode)) continue;
      const skipShuffle = NO_SHUFFLE_TYPES.includes(typeCode);
      for (const q of group.questions) {
        map[q.id] = skipShuffle ? q.options : seededShuffle(q.options, q.id);
      }
    }
    return map;
  }, [stimulus]);

  const totalQuestions = stimulus.questionGroups.reduce((sum, g) => sum + g.questions.length, 0);
  const answeredOptionCount = Object.keys(answers).filter(k => answers[Number(k)] !== 0).length;
  const answeredTextCount = Object.keys(textAnswers).filter(k => (textAnswers[Number(k)] ?? '').trim() !== '').length;
  const answeredCount = answeredOptionCount + answeredTextCount;

  return (
    <div className="space-y-6">
      {!submitted && (
        <div className="text-sm text-gray-500">
          Đã trả lời: {answeredCount}/{totalQuestions}
        </div>
      )}

      {stimulus.questionGroups.map((group, gi) => {
        const isMatching = MATCHING_TYPES.includes(group.questionTypeCode || '');
        return (
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

            {group.questionTypeCode === 'MATCHING_HEADINGS' ? (
              <ReadingMatchingPills
                questions={group.questions}
                answers={answers}
                submitted={submitted}
                selectedPillId={selectedPillId}
                onPillSelect={onPillSelect || (() => {})}
              />
            ) : group.questionTypeCode === 'MATCHING_INFORMATION' ? (
              <ReadingMatchingInformation
                questions={group.questions}
                answers={answers}
                submitted={submitted}
                onAnswer={selectAnswer}
              />
            ) : isMatching ? (
              <ReadingMatchingGroup
                questions={group.questions}
                answers={answers}
                submitted={submitted}
                onAnswer={selectAnswer}
              />
            ) : GAP_TYPES.includes(group.questionTypeCode || '') ? (
              <ReadingGapFilling
                questions={group.questions}
                groupContent={group.groupContent}
                imageUrl={group.imageUrl}
                submitted={submitted}
                textAnswers={textAnswers}
                onTextAnswer={onTextAnswer || (() => {})}
              />
            ) : (
              <div className="space-y-4">
                {group.questions.map((question) => {
                  const displayOptions = shuffledOptionsMap[question.id] || question.options;
                  return (
                    <ReadingQuestionMcq
                      key={question.id}
                      questionId={question.id}
                      position={question.position}
                      content={question.content}
                      options={displayOptions}
                      selectedId={answers[question.id]}
                      submitted={submitted}
                      explanation={question.explanation}
                      onAnswer={selectAnswer}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
