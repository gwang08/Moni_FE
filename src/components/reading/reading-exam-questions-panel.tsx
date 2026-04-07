'use client';

import { useMemo } from 'react';
import type { StimulusDetail, QuestionDetail } from '@/types/test.types';
import { ReadingQuestionMcq } from '@/components/reading/reading-question-mcq';
import { ReadingMatchingPills } from '@/components/reading/reading-matching-pills';
import { ReadingMatchingInformation } from '@/components/reading/reading-matching-information';
import { ReadingMatchingFeature } from '@/components/reading/reading-matching-feature';

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

const GAP_TYPES = ['GAP_FILLING', 'DIAGRAM_LABEL'];

/** IELTS-style inline gap input for exam mode */
function ExamInlineGapInput({
  questionId,
  userAnswer,
  submitted,
  displayNumber,
  onTextAnswer,
}: {
  questionId: number;
  userAnswer: string;
  submitted: boolean;
  displayNumber?: number;
  onTextAnswer: (questionId: number, text: string) => void;
}) {
  // Calculate input width based on content
  const minLength = 80;
  const charWidth = 8;
  const inputWidth = Math.max(minLength, userAnswer.length * charWidth + 32);
  const isBlank = userAnswer.trim().length === 0;

  return (
    <span className="relative inline-block align-middle" style={{ minWidth: `${minLength}px`, width: isBlank ? `${minLength}px` : `${inputWidth}px`, maxWidth: '400px' }}>
      <input
        type="text"
        value={userAnswer}
        disabled={submitted}
        onChange={(e) => onTextAnswer(questionId, e.target.value)}
        className="w-full rounded-sm border border-gray-400 bg-white px-2 text-center text-sm font-normal text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
        style={{ height: '20px', lineHeight: '20px' }}
        placeholder=""
      />
      {!submitted && isBlank && displayNumber != null && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900" style={{ lineHeight: '20px' }}>
          {displayNumber}
        </span>
      )}
    </span>
  );
}

/** IELTS-style sentence gap-filling for exam mode */
function IELTSGapFillingBox({
  questions,
  submitted,
  textAnswers,
  onTextAnswer,
  questionPositionById = {},
}: {
  questions: QuestionDetail[];
  submitted: boolean;
  textAnswers: Record<number, string>;
  onTextAnswer: (questionId: number, text: string) => void;
  questionPositionById?: Record<number, number>;
}) {
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

  // Helper to replace {{answer}} with ________
  const formatContent = (content: string) => {
    return content.replace(/\{\{.*?\}\}/g, '__________');
  };

  return (
    <div className="bg-white py-4">
      <div className="space-y-2">
        {sortedQuestions.map((q) => {
          const userAnswer = textAnswers[q.id] ?? '';
          return (
            <div key={q.id} id={`question-${q.id}`} className="py-1 border-b border-gray-100 last:border-0">
              <p className="text-sm text-gray-800 font-normal leading-7">
                {(() => {
                  const parsed = q.content.match(/^([\s\S]*?)\{\{(.+?)\}\}([\s\S]*)$/);
                  if (!parsed) {
                    return formatContent(q.content);
                  }

                  const displayNumber = questionPositionById[q.id] ?? q.position;

                  return (
                    <>
                      {parsed[1]}
                      <ExamInlineGapInput
                        questionId={q.id}
                        userAnswer={userAnswer}
                        submitted={submitted}
                        displayNumber={displayNumber}
                        onTextAnswer={onTextAnswer}
                      />
                      {parsed[3]}
                    </>
                  );
                })()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
}: Props) {
  const questionMeta = useMemo(() => {
    const questionPositionById: Record<number, number> = {};
    const questionRangeByGroupId: Record<number, { start: number; end: number }> = {};
    let currentPosition = 1;

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
  }, [stimulus.questionGroups]);

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
              <div className="space-y-4">
                {group.imageUrl && (
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    {/* Use plain <img> so remote diagram URLs work without Next image host config. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={group.imageUrl}
                      alt="Diagram"
                      className="max-w-full h-auto rounded"
                      loading="lazy"
                    />
                  </div>
                )}
                <IELTSGapFillingBox
                  questions={groupQuestions}
                  submitted={submitted}
                  textAnswers={textAnswers}
                  onTextAnswer={onTextAnswer || (() => {})}
                  questionPositionById={questionMeta.questionPositionById}
                />
              </div>
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
