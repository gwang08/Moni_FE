'use client';

import { useMemo } from 'react';
import type { StimulusDetail, OptionDetail, QuestionDetail } from '@/types/test.types';
import { ReadingQuestionMcq } from '@/components/reading/reading-question-mcq';
import { ReadingMatchingPills } from '@/components/reading/reading-matching-pills';
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
}

const GAP_TYPES = ['GAP_FILLING', 'DIAGRAM_LABEL'];

/** IELTS-style boxed gap input for exam mode */
function IELTSGapInput({
  questionId,
  userAnswer,
  submitted,
  onTextAnswer,
  questionNumber,
}: {
  questionId: number;
  userAnswer: string;
  submitted: boolean;
  onTextAnswer: (questionId: number, text: string) => void;
  questionNumber: number;
}) {
  return (
    <div className="relative inline-block">
      <input
        type="text"
        value={userAnswer}
        disabled={submitted}
        onChange={(e) => onTextAnswer(questionId, e.target.value)}
        className="text-center text-sm font-normal border border-gray-400 rounded-sm bg-white focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 px-2 py-1 transition-all"
        style={{ width: '160px', minWidth: '150px', height: '28px' }}
        placeholder=""
      />
      {!userAnswer && !submitted && (
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-400 pointer-events-none">
          {questionNumber}
        </span>
      )}
    </div>
  );
}

/** IELTS-style boxed gap-filling questions for exam mode */
function IELTSGapFillingBox({
  questions,
  submitted,
  textAnswers,
  onTextAnswer,
}: {
  questions: QuestionDetail[];
  submitted: boolean;
  textAnswers: Record<number, string>;
  onTextAnswer: (questionId: number, text: string) => void;
}) {
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

  // Helper to replace {{answer}} with ________
  const formatContent = (content: string) => {
    return content.replace(/\{\{.*?\}\}/g, '__________');
  };

  return (
    <div className="bg-white p-5 border border-gray-300 rounded-lg shadow-sm">
      <div className="space-y-3">
        {sortedQuestions.map((q) => {
          const userAnswer = textAnswers[q.id] ?? '';
          return (
            <div key={q.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-start gap-4 flex-1">
                <span className="min-w-[20px] text-sm font-normal text-gray-900 mt-0.5">
                  {q.position}
                </span>
                <p className="flex-1 text-sm text-gray-800 font-normal leading-relaxed">
                  {formatContent(q.content)}
                </p>
              </div>
              <IELTSGapInput
                questionId={q.id}
                userAnswer={userAnswer}
                submitted={submitted}
                onTextAnswer={onTextAnswer}
                questionNumber={q.position}
              />
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
}: {
  questions: QuestionDetail[];
  answers: Record<number, number>;
  submitted: boolean;
  onAnswer: (questionId: number, optionId: number) => void;
}) {
  return (
    <div className="bg-white p-5 border border-gray-300 rounded-lg shadow-sm">
      <div className="space-y-6">
        {questions.map((q) => {
          const selectedId = answers[q.id];
          return (
            <div key={q.id} className="space-y-3">
              <div className="flex items-start gap-4">
                <span className="min-w-[20px] text-sm font-normal text-gray-900 mt-0.5">
                  {q.position}
                </span>
                <p className="flex-1 text-sm text-gray-800 font-normal leading-relaxed">{q.content}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-9">
                {q.options.map((opt) => {
                  const isSelected = selectedId === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-md border-2 transition-all ${
                        isSelected
                          ? 'border-gray-800 bg-gray-50 text-gray-900'
                          : 'border-gray-100 hover:border-gray-200'
                      } cursor-pointer ${submitted ? 'cursor-default opacity-80' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={opt.id}
                        checked={isSelected}
                        disabled={submitted}
                        onChange={() => !submitted && onAnswer(q.id, opt.id)}
                        className="h-4 w-4 text-gray-900 border-gray-400 focus:ring-gray-900"
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
  const totalQuestions = stimulus.questionGroups.reduce(
    (sum, g) => sum + g.questions.length,
    0
  );

  // Calculate question range for this group
  let questionCounter = 0;

  return (
    <div className="space-y-8">
      {stimulus.questionGroups.map((group, groupIndex) => {
        const groupQuestions = group.questions;
        const startQuestion = questionCounter + 1;
        questionCounter += groupQuestions.length;
        const endQuestion = questionCounter;

        const isGapType = GAP_TYPES.includes(group.questionTypeCode || '');
        const isMCQType = ['MCQ', 'MCQ_MULTIPLE', 'TFNG', 'YNNG'].includes(
          group.questionTypeCode || ''
        );
        const isMatchingType = group.questionTypeCode === 'MATCHING_HEADINGS';

        return (
          <div key={group.id} className="space-y-4">
            {/* Questions header */}
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-800">
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
              <IELTSGapFillingBox
                questions={groupQuestions}
                submitted={submitted}
                textAnswers={textAnswers}
                onTextAnswer={onTextAnswer || (() => {})}
              />
            ) : isMCQType ? (
              <IELTSMCQBox
                questions={groupQuestions}
                answers={answers}
                submitted={submitted}
                onAnswer={onAnswer}
              />
            ) : isMatchingType ? (
              <div className="bg-white p-5 border border-gray-300 rounded-lg shadow-sm">
                <ReadingMatchingPills
                  questions={groupQuestions}
                  answers={answers}
                  submitted={submitted}
                  selectedPillId={selectedPillId}
                  onPillSelect={onPillSelect || (() => {})}
                />
              </div>
            ) : (
              <div className="bg-white p-5 border border-gray-300 rounded-lg shadow-sm">
                <ReadingQuestionMcq
                  questionId={groupQuestions[0]?.id}
                  position={groupQuestions[0]?.position}
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
