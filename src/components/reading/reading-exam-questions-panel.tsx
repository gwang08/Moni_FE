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
  answers: Record<number, number>;
  onAnswer: (questionId: number, optionId: number) => void;
  textAnswers?: Record<number, string>;
  onTextAnswer?: (questionId: number, text: string) => void;
  selectedPillId?: number | null;
  onPillSelect?: (id: number | null) => void;
  /** Global question number offset for multi-part tests */
  globalQuestionOffset?: number;
}

const GAP_TYPES = ['GAP_FILLING', 'DIAGRAM_LABEL'];



/** IELTS-style MCQ questions in boxed layout for exam mode */
function IELTSMCQBox({
  questions,
  answers,
  submitted,
  onAnswer,
  questionPositionById = {},
}: {
  questions: QuestionDetail[];
  answers: Record<number, number>;
  submitted: boolean;
  onAnswer: (questionId: number, optionId: number) => void;
  questionPositionById?: Record<number, number>;
}) {
  return (
    <div className="bg-white py-4">
      <div className="space-y-6">
        {questions.map((q) => {
          const selectedId = answers[q.id];
          const displayNumber = questionPositionById[q.id] ?? q.position;
          return (
            <div key={q.id} id={`question-${q.id}`} className="space-y-3">
              <div className="flex items-start gap-4">
                <span className="min-w-[20px] text-sm font-bold text-gray-900 mt-0.5">
                  {displayNumber}
                </span>
                <p className="flex-1 text-sm text-gray-800 font-normal leading-relaxed">{q.content}</p>
              </div>
              <div className="space-y-3">
                {q.options.map((opt) => {
                  const isSelected = selectedId === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-md border-2 transition-all w-full ${
                        isSelected
                          ? 'border-blue-600 bg-[#cfe0f4] text-gray-900'
                          : 'border-gray-200 hover:border-gray-300'
                      } cursor-pointer ${submitted ? 'cursor-default opacity-80' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={opt.id}
                        checked={isSelected}
                        disabled={submitted}
                        onChange={() => !submitted && onAnswer(q.id, opt.id)}
                        className="h-4 w-4 text-blue-600 border-gray-400 focus:ring-blue-600"
                      />
                      <span className="text-sm font-normal leading-tight">{opt.content}</span>
                    </label>
                  );
                })}
              </div>
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
  answers,
  onAnswer,
  textAnswers = {},
  onTextAnswer,
  selectedPillId = null,
  onPillSelect,
  globalQuestionOffset,
}: Props) {
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
                submitted={submitted}
                textAnswers={textAnswers}
                onTextAnswer={onTextAnswer || (() => {})}
                questionPositionById={questionMeta.questionPositionById}
                examMode
              />
            ) : isMatchingHeadings ? (
              <div className="bg-white p-5">
                <ReadingMatchingPills
                  questions={groupQuestions}
                  answers={answers}
                  submitted={submitted}
                  selectedPillId={selectedPillId}
                  onPillSelect={onPillSelect || (() => {})}
                />
              </div>
            ) : isMatchingInformation ? (
              <div className="bg-white">
                <ReadingMatchingInformation
                  questions={groupQuestions}
                  answers={answers}
                  submitted={submitted}
                  onAnswer={onAnswer}
                  examMode
                  questionPositionById={questionMeta.questionPositionById}
                />
              </div>
            ) : isMatchingFeature ? (
              <div className="bg-white">
                <ReadingMatchingFeature
                  questions={groupQuestions}
                  answers={answers}
                  submitted={submitted}
                  onAnswer={onAnswer}
                  examMode
                  questionPositionById={questionMeta.questionPositionById}
                />
              </div>
            ) : isMCQType ? (
              <IELTSMCQBox
                questions={groupQuestions}
                answers={answers}
                submitted={submitted}
                onAnswer={onAnswer}
                questionPositionById={questionMeta.questionPositionById}
              />
            ) : (
              <div className="bg-white p-5">
                <ReadingQuestionMcq
                  questionId={groupQuestions[0]?.id}
                  position={questionMeta.questionPositionById[groupQuestions[0]?.id ?? -1] ?? groupQuestions[0]?.position}
                  content={groupQuestions[0]?.content}
                  options={groupQuestions[0]?.options}
                  selectedId={answers[groupQuestions[0]?.id]}
                  submitted={submitted}
                  onAnswer={onAnswer}
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
