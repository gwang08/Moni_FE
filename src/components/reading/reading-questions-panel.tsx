'use client';

import { useMemo } from 'react';
import type { StimulusDetail, OptionDetail } from '@/types/test.types';
import { ReadingQuestionMcq } from '@/components/reading/reading-question-mcq';
import { ReadingMatchingGroup } from '@/components/reading/reading-matching-group';
import { ReadingMatchingInformation } from '@/components/reading/reading-matching-information';
import { ReadingMatchingFeature } from '@/components/reading/reading-matching-feature';
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

const SHUFFLE_TYPES = ['MATCHING_HEADINGS', 'MATCHING_INFORMATION', 'MATCHING_FEATURE'];
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
  examMode?: boolean;
}

export function ReadingQuestionsPanel({ stimulus, submitted = false, answers, onAnswer, textAnswers = {}, onTextAnswer, selectedPillId = null, onPillSelect, examMode = false }: Props) {
  const selectAnswer = (questionId: number, optionId: number) => {
    if (submitted) return;
    onAnswer(questionId, optionId);
  };

  const shuffledOptionsMap = useMemo(() => {
    const map: Record<number, OptionDetail[]> = {};
    for (const group of stimulus.questionGroups) {
      const typeCode = group.questionTypeCode || '';
      if (MATCHING_TYPES.includes(typeCode) || GAP_TYPES.includes(typeCode)) continue;
      const shouldShuffle = SHUFFLE_TYPES.includes(typeCode);
      for (const q of group.questions) {
        map[q.id] = shouldShuffle ? seededShuffle(q.options, q.id) : q.options;
      }
    }
    return map;
  }, [stimulus]);

  const totalQuestions = stimulus.questionGroups.reduce((sum, g) => sum + g.questions.length, 0);
  const answeredOptionCount = Object.keys(answers).filter(k => answers[Number(k)] !== 0).length;
  const answeredTextCount = Object.keys(textAnswers).filter(k => (textAnswers[Number(k)] ?? '').trim() !== '').length;
  const answeredCount = answeredOptionCount + answeredTextCount;

  return (
    <div className="space-y-6 text-gray-900">
      {!submitted && (
        <div className="text-sm text-gray-600">
          Đã trả lời: {answeredCount}/{totalQuestions}
        </div>
      )}

      {stimulus.questionGroups.map((group, gi) => {
        const isMatching = MATCHING_TYPES.includes(group.questionTypeCode || '');
        // Calculate global question offset (sum of all previous groups' question counts)
        const questionOffset = stimulus.questionGroups
          .slice(0, gi)
          .reduce((sum, g) => sum + g.questions.length, 0);
        // Remap questions with global position so all child components show correct numbers
        const globalQuestions = group.questions.map(q => ({
          ...q,
          position: questionOffset + q.position,
        }));
        return (
          <div key={group.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${examMode ? 'text-gray-900 bg-white border-gray-300' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                Nhóm {gi + 1}
              </span>
            </div>
            {group.instruction && (
              <p className={`text-sm italic mb-4 rounded-lg px-3 py-2 border ${examMode ? 'text-gray-800 bg-gray-50 border-gray-200' : 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                {group.instruction}
              </p>
            )}

            {group.questionTypeCode === 'MATCHING_HEADINGS' ? (
              <ReadingMatchingPills
                questions={globalQuestions}
                answers={answers}
                submitted={submitted}
                selectedPillId={selectedPillId}
                onPillSelect={onPillSelect || (() => {})}
              />
            ) : group.questionTypeCode === 'MATCHING_INFORMATION' ? (
              <ReadingMatchingInformation
                questions={globalQuestions}
                answers={answers}
                submitted={submitted}
                onAnswer={selectAnswer}
              />
            ) : group.questionTypeCode === 'MATCHING_FEATURE' ? (
              <ReadingMatchingFeature
                questions={globalQuestions}
                answers={answers}
                submitted={submitted}
                onAnswer={selectAnswer}
              />
            ) : isMatching ? (
              <ReadingMatchingGroup
                questions={globalQuestions}
                answers={answers}
                submitted={submitted}
                onAnswer={selectAnswer}
              />
            ) : GAP_TYPES.includes(group.questionTypeCode || '') ? (
              <ReadingGapFilling
                questions={globalQuestions}
                groupContent={group.groupContent}
                imageUrl={group.imageUrl}
                submitted={submitted}
                textAnswers={textAnswers}
                onTextAnswer={onTextAnswer || (() => {})}
                examMode={examMode}
              />
            ) : (
              <div className="space-y-4">
                {globalQuestions.map((question) => {
                  const displayOptions = shuffledOptionsMap[question.id] || question.options;
                  return (
                    <ReadingQuestionMcq
                      key={question.id}
                      questionId={question.id}
                      position={question.position}
                      content={question.content}
                      options={displayOptions}
                      selectedId={answers[question.id]}
                      multiple={group.questionTypeCode === 'MCQ_MULTIPLE'}
                      submitted={submitted}
                      explanation={question.explanation}
                      onAnswer={selectAnswer}
                      examMode={examMode}
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
