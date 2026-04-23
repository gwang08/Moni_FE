'use client';

import { useMemo } from 'react';
import type { StimulusDetail, QuestionDetail } from '@/types/test.types';
import { ReadingQuestionMcq } from '@/components/reading/reading-question-mcq';
import { ReadingMatchingPills } from '@/components/reading/reading-matching-pills';
import { ReadingMatchingInformation } from '@/components/reading/reading-matching-information';
import { ReadingMatchingFeature } from '@/components/reading/reading-matching-feature';
import { ReadingGapFilling } from '@/components/reading/reading-gap-filling';

interface Props {
  stimulus: StimulusDetail;
  submitted?: boolean;
  readOnly?: boolean;
  answers: Record<number, number>;
  onAnswer: (questionId: number, optionId: number) => void;
  textAnswers?: Record<number, string>;
  onTextAnswer?: (questionId: number, text: string) => void;
  selectedPillId?: number | null;
  onPillSelect?: (id: number | null) => void;
  /** Global question number offset for multi-part tests */
  globalQuestionOffset?: number;
  onLocateEvidence?: (evidence: string, offset?: number, startOffset?: number, endOffset?: number) => void;
}

const GAP_TYPES = ['GAP_FILLING', 'DIAGRAM_LABEL'];



/** IELTS-style MCQ questions in boxed layout for exam mode */
function IELTSMCQBox({
  questions,
  answers,
  submitted,
  onAnswer,
  questionPositionById = {},
  onLocateEvidence,
}: {
  questions: QuestionDetail[];
  answers: Record<number, number>;
  submitted: boolean;
  onAnswer: (questionId: number, optionId: number) => void;
  questionPositionById?: Record<number, number>;
  onLocateEvidence?: (evidence: string, offset?: number, startOffset?: number, endOffset?: number) => void;
}) {
  return (
    <div className="bg-white py-4">
      <div className="space-y-6">
        {questions.map((q) => {
          const selectedId = answers[q.id];
          const displayNumber = questionPositionById[q.id] ?? q.position;
          return (
            <div key={q.id} id={`question-${q.id}`} className="space-y-3">
              <ReadingQuestionMcq
                questionId={q.id}
                position={displayNumber}
                content={q.content}
                options={q.options}
                selectedId={selectedId}
                submitted={submitted}
                onAnswer={onAnswer}
                explanation={q.explanation}
                onLocateEvidence={onLocateEvidence}
                examMode
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReadingExamQuestionsPanel({
  stimulus,
  submitted = false,
  readOnly = false,
  answers,
  onAnswer,
  textAnswers = {},
  onTextAnswer = () => {},
  selectedPillId = null,
  onPillSelect = () => {},
  globalQuestionOffset = 1,
  onLocateEvidence,
}: Props) {
  const isDisabled = submitted || readOnly;

  const questionMeta = useMemo(() => {
    const questionPositionById: Record<number, number> = {};
    const questionRangeByGroupId: Record<number, { start: number; end: number }> = {};
    let currentPosition = globalQuestionOffset ?? 1;

    for (const group of stimulus.questionGroups) {
      const start = currentPosition;
      for (const question of group.questions) {
        questionPositionById[question.id] = currentPosition;
        currentPosition += 1;
      }
      questionRangeByGroupId[group.id] = {
        start,
        end: currentPosition - 1,
      };
    }

    return { questionPositionById, questionRangeByGroupId };
  }, [stimulus.questionGroups, globalQuestionOffset]);

  return (
    <div className="space-y-8 px-5">
      {stimulus.questionGroups.map((group) => {
        const groupQuestions = group.questions;
        const { start: startQuestion, end: endQuestion } = questionMeta.questionRangeByGroupId[group.id] ?? {
          start: 1,
          end: groupQuestions.length,
        };

        const isGapType = GAP_TYPES.includes(group.questionTypeCode || '');
        const isMCQType = ['MCQ', 'MCQ_MULTIPLE', 'TFNG', 'YNNG'].includes(
          group.questionTypeCode || ''
        );
        const isMatchingHeadings = group.questionTypeCode === 'MATCHING_HEADINGS';
        const isMatchingInformation = group.questionTypeCode === 'MATCHING_INFORMATION';
        const isMatchingFeature = group.questionTypeCode === 'MATCHING_FEATURE';

        return (
          <div key={group.id} className="space-y-4">
            {/* Questions header - removed border/frame to match IELTS style */}
            <div className="py-2">
              <h2 className="text-lg font-bold text-gray-900">
                Questions {startQuestion}-{endQuestion}
              </h2>
              {group.instruction && (
                <p className="text-sm text-gray-700 mt-2 leading-relaxed font-bold">
                  {group.instruction}
                </p>
              )}
            </div>

            {/* Question content in boxed layout */}
            {isGapType ? (
              <ReadingGapFilling
                questions={groupQuestions}
                groupContent={group.groupContent}
                imageUrl={group.imageUrl}
                submitted={isDisabled}
                textAnswers={textAnswers}
                onTextAnswer={onTextAnswer || (() => {})}
                questionPositionById={questionMeta.questionPositionById}
                onLocateEvidence={onLocateEvidence}
                examMode
              />
            ) : isMatchingHeadings ? (
              <div className="bg-white p-5">
                <ReadingMatchingPills
                  questions={groupQuestions}
                  answers={answers}
                  submitted={isDisabled}
                  selectedPillId={selectedPillId}
                  onPillSelect={onPillSelect || (() => {})}
                />
              </div>
            ) : isMatchingInformation ? (
              <div className="bg-white">
                <ReadingMatchingInformation
                  questions={groupQuestions}
                  answers={answers}
                  submitted={isDisabled}
                  onAnswer={onAnswer}
                  examMode
                  questionPositionById={questionMeta.questionPositionById}
                  onLocateEvidence={onLocateEvidence}
                />
              </div>
            ) : isMatchingFeature ? (
              <div className="bg-white">
                <ReadingMatchingFeature
                  questions={groupQuestions}
                  answers={answers}
                  submitted={isDisabled}
                  onAnswer={onAnswer}
                  examMode
                  questionPositionById={questionMeta.questionPositionById}
                  onLocateEvidence={onLocateEvidence}
                />
              </div>
            ) : isMCQType ? (
              <IELTSMCQBox
                questions={groupQuestions}
                answers={answers}
                submitted={isDisabled}
                onAnswer={onAnswer}
                questionPositionById={questionMeta.questionPositionById}
                onLocateEvidence={onLocateEvidence}
              />
            ) : (
              <div className="bg-white p-5">
                <ReadingQuestionMcq
                  questionId={groupQuestions[0]?.id}
                  position={questionMeta.questionPositionById[groupQuestions[0]?.id ?? -1] ?? groupQuestions[0]?.position}
                  content={groupQuestions[0]?.content}
                  options={groupQuestions[0]?.options}
                  selectedId={answers[groupQuestions[0]?.id]}
                  submitted={isDisabled}
                  onAnswer={onAnswer}
                  explanation={groupQuestions[0]?.explanation}
                  onLocateEvidence={onLocateEvidence}
                  examMode
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
