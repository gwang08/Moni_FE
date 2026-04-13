'use client';

import { ListeningQuestionMcq } from '@/components/listening/listening-question-mcq';
import { ListeningGapFilling } from '@/components/listening/listening-gap-filling';
import { ListeningMatchingFeature } from '@/components/listening/listening-matching-feature';
import { ListeningMatchingInformation } from '@/components/listening/listening-matching-information';
import type { StimulusDetail, QuestionDetail, QuestionGroupDetail } from '@/types/test.types';
import { QUESTION_TYPE_LABELS } from '@/components/practice/question-type-filter';
import { Lightbulb, Eye } from 'lucide-react';
import React from 'react';

const GAP_TYPES = ['GAP_FILLING', 'DIAGRAM_LABEL'];
const MCQ_TYPES = ['MCQ', 'MCQ_MULTIPLE', 'TFNG', 'YNNG'];
const MATCHING_FEATURE_TYPES = ['MATCHING_FEATURE'];
const MATCHING_INFORMATION_TYPES = ['MATCHING_INFORMATION'];

function getQuestionTypeLabel(typeCode: string) {
  return QUESTION_TYPE_LABELS[typeCode] || typeCode.replace(/_/g, ' ');
}

interface Props {
  stimulus: StimulusDetail;
  answers: Record<number, number>;
  textAnswers?: Record<number, string>;
  onLocateEvidence: (evidence: string) => void;
}

/** Matching review: statement + number + user answer (strikethrough if wrong) + correct answer with icons */
function MatchingQuestionReview({ question, displayPosition, selectedOption, correctOption, isCorrect, isSkipped, onLocateEvidence }: {
  question: QuestionDetail;
  displayPosition: number;
  selectedOption: { label: string; content: string; isCorrect: boolean } | null;
  correctOption: { label: string; content: string } | undefined;
  isCorrect: boolean;
  isSkipped: boolean;
  onLocateEvidence: (evidence: string) => void;
}) {
  return (
    <div id={`review-question-${question.id}`} className="flex items-center gap-2 py-2 text-sm flex-wrap">
      {/* Statement */}
      <span className="text-gray-800 flex-1 min-w-[200px]">{question.content}</span>
      {/* Position badge */}
      <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600">
        {displayPosition}
      </span>
      {/* User answer */}
      {isSkipped ? (
        <>
          <span className="px-2 py-1 rounded border border-gray-200 text-gray-400 text-xs text-center">—</span>
          {correctOption && (
            <span className="px-2 py-1 rounded border border-green-300 bg-green-50 text-green-700 text-xs font-medium flex items-center gap-1">
              {correctOption.content}
              {question.explanation && (
                <span className="flex items-center gap-1 ml-1">
                  {question.explanation.text && (
                    <Lightbulb className="h-3.5 w-3.5 text-yellow-600" />
                  )}
                  {question.explanation.evidence && (
                    <button
                      type="button"
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                      title={`Highlight dẫn chứng câu ${displayPosition}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocateEvidence(question.explanation?.evidence ?? '');
                      }}
                    >
                      <Eye className="h-4 w-4 text-gray-900" strokeWidth={2.5} />
                    </button>
                  )}
                </span>
              )}
            </span>
          )}
        </>
      ) : isCorrect ? (
        <span className="px-2 py-1 rounded border border-green-300 bg-green-50 text-green-700 text-xs font-medium flex items-center gap-1">
          {selectedOption?.content}
          <span className="text-green-500">✓</span>
          {question.explanation && (
            <span className="flex items-center gap-1 ml-1">
              {question.explanation.text && (
                <Lightbulb className="h-3.5 w-3.5 text-yellow-600" />
              )}
              {question.explanation.evidence && (
                <button
                  type="button"
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  title={`Highlight dẫn chứng câu ${displayPosition}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLocateEvidence(question.explanation?.evidence ?? '');
                  }}
                >
                  <Eye className="h-4 w-4 text-gray-900" strokeWidth={2.5} />
                </button>
              )}
            </span>
          )}
        </span>
      ) : (
        <>
          <span className="px-2 py-1 rounded border border-red-300 bg-red-50 text-red-500 text-xs font-medium line-through flex items-center gap-1">
            {selectedOption?.content ?? '—'}
            <span>✕</span>
          </span>
          {correctOption && (
            <span className="px-2 py-1 rounded border border-green-300 bg-green-50 text-green-700 text-xs font-medium flex items-center gap-1">
              {correctOption.content}
              {question.explanation && (
                <span className="flex items-center gap-1 ml-1">
                  {question.explanation.text && (
                    <Lightbulb className="h-3.5 w-3.5 text-yellow-600" />
                  )}
                  {question.explanation.evidence && (
                    <button
                      type="button"
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                      title={`Highlight dẫn chứng câu ${displayPosition}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocateEvidence(question.explanation?.evidence ?? '');
                      }}
                    >
                      <Eye className="h-4 w-4 text-gray-900" strokeWidth={2.5} />
                    </button>
                  )}
                </span>
              )}
            </span>
          )}
        </>
      )}
    </div>
  );
}

/** Render a question group in review mode based on its type */
function ReviewQuestionGroup({ group, answers, textAnswers, displayPositionByQuestionId, onLocateEvidence }: {
  group: QuestionGroupDetail;
  answers: Record<number, number>;
  textAnswers: Record<number, string>;
  displayPositionByQuestionId: Record<number, number>;
  onLocateEvidence: (evidence: string) => void;
}) {
  const typeCode = group.questionTypeCode || '';

  // MCQ / TFNG / YNNG — use ListeningQuestionMcq in submitted mode
  if (MCQ_TYPES.includes(typeCode)) {
    return (
      <div className="space-y-3">
        {group.questions.map(q => (
          <ListeningQuestionMcq
            key={q.id}
            questionId={q.id}
            position={displayPositionByQuestionId[q.id] ?? q.position}
            content={q.content}
            options={q.options}
            selectedId={answers[q.id]}
            submitted={true}
            explanation={q.explanation}
            onAnswer={() => {}}
            onLocateEvidence={onLocateEvidence}
          />
        ))}
      </div>
    );
  }

  // Gap Filling / Diagram Label — use ListeningGapFilling in submitted mode
  if (GAP_TYPES.includes(typeCode)) {
    return (
      <ListeningGapFilling
        questions={group.questions}
        groupContent={group.groupContent}
        imageUrl={group.imageUrl}
        submitted={true}
        textAnswers={textAnswers}
        questionPositionById={displayPositionByQuestionId}
        onTextAnswer={() => {}}
        onLocateEvidence={onLocateEvidence}
      />
    );
  }

  // Matching Feature — inline review with icons
  if (MATCHING_FEATURE_TYPES.includes(typeCode)) {
    return (
      <div className="divide-y divide-gray-100">
        {group.questions.map(q => {
          const selectedId = answers[q.id];
          const selectedOption = selectedId != null ? q.options.find(o => o.id === selectedId) : null;
          const correctOption = q.options.find(o => o.isCorrect);
          const isSkipped = selectedId == null;
          const isCorrect = selectedOption?.isCorrect === true;

          return (
            <MatchingQuestionReview
              key={q.id}
              question={q}
              displayPosition={displayPositionByQuestionId[q.id] ?? q.position}
              selectedOption={selectedOption ? { label: selectedOption.label, content: selectedOption.content, isCorrect: selectedOption.isCorrect } : null}
              correctOption={correctOption ? { label: correctOption.label, content: correctOption.content } : undefined}
              isCorrect={isCorrect}
              isSkipped={isSkipped}
              onLocateEvidence={onLocateEvidence}
            />
          );
        })}
      </div>
    );
  }

  // Matching Information — inline review with icons
  if (MATCHING_INFORMATION_TYPES.includes(typeCode)) {
    return (
      <div className="divide-y divide-gray-100">
        {group.questions.map(q => {
          const selectedId = answers[q.id];
          const selectedOption = selectedId != null ? q.options.find(o => o.id === selectedId) : null;
          const correctOption = q.options.find(o => o.isCorrect);
          const isSkipped = selectedId == null;
          const isCorrect = selectedOption?.isCorrect === true;

          return (
            <MatchingQuestionReview
              key={q.id}
              question={q}
              displayPosition={displayPositionByQuestionId[q.id] ?? q.position}
              selectedOption={selectedOption ? { label: selectedOption.label, content: selectedOption.content, isCorrect: selectedOption.isCorrect } : null}
              correctOption={correctOption ? { label: correctOption.label, content: correctOption.content } : undefined}
              isCorrect={isCorrect}
              isSkipped={isSkipped}
              onLocateEvidence={onLocateEvidence}
            />
          );
        })}
      </div>
    );
  }

  // Fallback: generic badge style with icons
  return (
    <div className="space-y-3">
      {group.questions.map(q => {
        const correctOption = q.options.find(o => o.isCorrect);
        const selectedId = answers[q.id];
        const selectedOption = selectedId != null ? q.options.find(o => o.id === selectedId) : null;
        const isCorrect = selectedOption?.isCorrect === true;
        const isSkipped = selectedId == null;

        return (
          <div key={q.id} id={`review-question-${q.id}`} className="border border-gray-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-gray-800">
              <span className="text-blue-600 font-bold mr-1">{displayPositionByQuestionId[q.id] ?? q.position}.</span>
              {q.content}
            </p>
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <span className="text-gray-500">Bạn trả lời:</span>
              {isSkipped ? (
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">Bỏ qua</span>
              ) : (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedOption?.label && `${selectedOption.label}. `}{selectedOption?.content}
                </span>
              )}
            </div>
            {!isCorrect && correctOption && (
              <div className="text-sm flex gap-2 items-center flex-wrap">
                <span className="text-gray-500">Đáp án:</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                  {correctOption.label && `${correctOption.label}. `}{correctOption.content}
                  {q.explanation && (
                    <span className="flex items-center gap-1 ml-1">
                      {q.explanation.text && (
                        <Lightbulb className="h-3.5 w-3.5 text-yellow-600" />
                      )}
                      {q.explanation.evidence && (
                        <button
                          type="button"
                          className="w-5 h-5 rounded-full bg-violet-100 hover:bg-violet-200 flex items-center justify-center text-violet-600"
                          title={`Highlight dẫn chứng câu ${displayPositionByQuestionId[q.id] ?? q.position}`}
                          onClick={() => onLocateEvidence(q.explanation?.evidence ?? '')}
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ListeningReviewPanel({ stimulus, answers, textAnswers = {}, onLocateEvidence }: Props) {
  const allQuestions = stimulus.questionGroups.flatMap(g => g.questions);
  const displayPositionByQuestionId = allQuestions.reduce<Record<number, number>>((acc, q, idx) => {
    acc[q.id] = idx + 1;
    return acc;
  }, {});

  const scrollToQuestion = (questionId: number) => {
    const el = document.getElementById(`question-${questionId}`) || document.getElementById(`review-question-${questionId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar-thick p-6 space-y-6">
        {stimulus.questionGroups.map((group, gi) => (
          <div key={group.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Nhóm {gi + 1}
              </span>
              {group.questionTypeCode && (
                <span className="text-[10px] text-gray-400">{getQuestionTypeLabel(group.questionTypeCode)}</span>
              )}
            </div>
            {group.instruction && (
              <p className="text-sm text-gray-600 italic mb-4 bg-gray-50 rounded-lg px-3 py-2">
                {group.instruction}
              </p>
            )}
            <ReviewQuestionGroup
              group={group}
              answers={answers}
              textAnswers={textAnswers}
              displayPositionByQuestionId={displayPositionByQuestionId}
              onLocateEvidence={onLocateEvidence}
            />
          </div>
        ))}
      </div>

      {/* Bottom navigation bar — continuous numbering across groups */}
      <div className="border-t bg-white px-4 py-3 flex flex-wrap gap-2">
        {allQuestions.map((q, idx) => {
          const group = stimulus.questionGroups.find(g => g.questions.some(gq => gq.id === q.id));
          const isGap = GAP_TYPES.includes(group?.questionTypeCode || '');

          let isCorrect: boolean;
          let isSkipped: boolean;
          if (isGap) {
            const userText = (textAnswers[q.id] ?? '').trim();
            const correctAnswer = (q.options.find(o => o.isCorrect)?.content ?? '').trim();
            isSkipped = !userText;
            isCorrect = !isSkipped && correctAnswer.split('|').map(a => a.trim().toLowerCase()).includes(userText.toLowerCase());
          } else {
            const selectedId = answers[q.id];
            isSkipped = selectedId == null;
            isCorrect = !isSkipped && (q.options.find(o => o.id === selectedId)?.isCorrect ?? false);
          }

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => scrollToQuestion(q.id)}
              className={`w-7 h-7 rounded-full text-xs font-semibold border transition-colors ${
                isSkipped
                  ? 'bg-gray-100 border-gray-300 text-gray-500'
                  : isCorrect
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : 'bg-red-100 border-red-400 text-red-700'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
