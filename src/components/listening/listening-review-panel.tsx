'use client';

import { useState } from 'react';
import { ListeningQuestionMcq } from '@/components/listening/listening-question-mcq';
import { ListeningGapFilling } from '@/components/listening/listening-gap-filling';
import { ListeningMatchingFeature } from '@/components/listening/listening-matching-feature';
import { ListeningMatchingInformation } from '@/components/listening/listening-matching-information';
import type { StimulusDetail, QuestionDetail, QuestionGroupDetail } from '@/types/test.types';
import { QUESTION_TYPE_LABELS } from '@/components/practice/question-type-filter';
import { Lightbulb } from 'lucide-react';
import React from 'react';

// Custom Target/Aim icon component - bullseye style
function TargetIcon({ className = 'h-4 w-4', strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

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
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div id={`review-question-${question.id}`} className="py-3 text-sm">
      {/* Statement + Position + Answer */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-gray-800 flex-1 min-w-[200px]">{question.content}</span>
        <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600">
          {displayPosition}
        </span>
        {isSkipped ? (
          <>
            <span className="px-2 py-1 rounded border border-gray-200 text-gray-400 text-xs text-center">—</span>
            {correctOption && (
              <span className="px-2 py-1 rounded border border-green-300 bg-green-50 text-green-700 text-xs font-medium">
                {correctOption.content}
              </span>
            )}
          </>
        ) : isCorrect ? (
          <span className="px-2 py-1 rounded border border-green-300 bg-green-50 text-green-700 text-xs font-medium flex items-center gap-1">
            {selectedOption?.content}
            <span className="text-green-500">✓</span>
          </span>
        ) : (
          <>
            <span className="px-2 py-1 rounded border border-red-300 bg-red-50 text-red-500 text-xs font-medium line-through flex items-center gap-1">
              {selectedOption?.content ?? '—'}
              <span>✕</span>
            </span>
            {correctOption && (
              <span className="px-2 py-1 rounded border border-green-300 bg-green-50 text-green-700 text-xs font-medium">
                {correctOption.content}
              </span>
            )}
          </>
        )}
      </div>

      {/* Explanation section with icons */}
      {question.explanation && (question.explanation.text || question.explanation.evidence) && (
        <div className="flex items-center gap-2 ml-9">
          {question.explanation.evidence && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLocateEvidence(question.explanation?.evidence ?? '');
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              title="Xem dẫn chứng"
            >
              <TargetIcon className="h-4 w-4 text-gray-900" strokeWidth={2} />
            </button>
          )}
          {question.explanation.text && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowExplanation(!showExplanation);
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                showExplanation ? 'bg-yellow-200 hover:bg-yellow-300' : 'bg-yellow-100 hover:bg-yellow-200'
              }`}
              title="Xem giải thích"
            >
              <Lightbulb className={`h-4 w-4 ${showExplanation ? 'text-yellow-800' : 'text-yellow-700'}`} />
            </button>
          )}
        </div>
      )}
      {showExplanation && question.explanation?.text && (
        <div className="ml-9 mt-2 text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
          {question.explanation.text.replace(/^Câu\s+\d+\s*[-–—]\s*Giải thích đáp án\s*/i, '')}
        </div>
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
                  {selectedOption?.content}
                </span>
              )}
            </div>
            {!isCorrect && correctOption && (
              <ExplanationSection explanation={q.explanation} onLocateEvidence={onLocateEvidence} position={displayPositionByQuestionId[q.id] ?? q.position} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Explanation section with toggleable explanation text */
function ExplanationSection({ explanation, onLocateEvidence, position }: {
  explanation?: { text?: string; evidence?: string };
  onLocateEvidence?: (evidence: string) => void;
  position: number;
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  if (!explanation || (!explanation.text && !explanation.evidence)) return null;

  // Remove "Câu X - Giải thích đáp án" prefix from explanation text
  const cleanExplanation = explanation.text?.replace(/^Câu\s+\d+\s*[-–—]\s*Giải thích đáp án\s*/i, '') || explanation.text;

  return (
    <div className="flex items-center gap-2">
      {explanation.evidence && onLocateEvidence && (
        <button
          type="button"
          onClick={() => onLocateEvidence(explanation?.evidence ?? '')}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Xem dẫn chứng"
        >
          <TargetIcon className="h-4 w-4 text-gray-900" strokeWidth={2} />
        </button>
      )}
      {explanation.text && (
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
            showExplanation ? 'bg-yellow-200 hover:bg-yellow-300' : 'bg-yellow-100 hover:bg-yellow-200'
          }`}
          title="Xem giải thích"
        >
          <Lightbulb className={`h-4 w-4 ${showExplanation ? 'text-yellow-800' : 'text-yellow-700'}`} />
        </button>
      )}
      {showExplanation && cleanExplanation && (
        <div className="w-full mt-2 text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
          {cleanExplanation}
        </div>
      )}
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
