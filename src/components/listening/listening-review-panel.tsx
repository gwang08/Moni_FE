'use client';

import { useState } from 'react';
import { ListeningQuestionMcq } from '@/components/listening/listening-question-mcq';
import { ListeningGapFilling } from '@/components/listening/listening-gap-filling';
import { ListeningMatchingFeature } from '@/components/listening/listening-matching-feature';
import { ListeningMatchingInformation } from '@/components/listening/listening-matching-information';
import type { StimulusDetail, QuestionDetail, QuestionGroupDetail } from '@/types/test.types';
import { QUESTION_TYPE_LABELS } from '@/components/practice/question-type-filter';
import { Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
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
    <div id={`review-question-${question.id}`} className="py-4 text-sm border-b border-slate-50 last:border-0">
      {/* Statement + Position + Answer */}
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <span className="text-slate-700 flex-1 min-w-[200px] font-medium">{question.content}</span>
        
        <div className="flex items-center gap-2">
          {isSkipped ? (
            <div className="flex items-center gap-1.5">
               <span className="text-slate-400 font-bold">✕</span>
               <span className="text-slate-400 mx-1">→</span>
               <span className="text-green-600 font-bold">{correctOption?.content}</span>
            </div>
          ) : isCorrect ? (
            <span className="text-green-600 font-bold flex items-center gap-1">
              {selectedOption?.content}
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 line-through font-medium">{selectedOption?.content ?? '—'}</span>
              <span className="text-slate-400 mx-1">→</span>
              <span className="text-green-600 font-bold">{correctOption?.content}</span>
            </div>
          )}

          {question.explanation?.evidence && (
            <button
              onClick={() => onLocateEvidence(question.explanation?.evidence ?? '')}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-900"
            >
              <TargetIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
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

  // MCQ / TFNG / YNNG
  if (MCQ_TYPES.includes(typeCode)) {
    return (
      <div className="space-y-6">
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

  // Gap Filling / Diagram Label
  if (GAP_TYPES.includes(typeCode)) {
    return (
      <div className="bg-white rounded-2xl p-2">
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
      </div>
    );
  }

  // Matching (Information or Feature)
  if (MATCHING_INFORMATION_TYPES.includes(typeCode) || MATCHING_FEATURE_TYPES.includes(typeCode)) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
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

  return null;
}

export function ListeningReviewPanel({ stimulus, answers, textAnswers = {}, onLocateEvidence }: Props) {
  const allQuestions = stimulus.questionGroups.flatMap(g => g.questions);
  const displayPositionByQuestionId = allQuestions.reduce<Record<number, number>>((acc, q, idx) => {
    acc[q.id] = idx + 1;
    return acc;
  }, {});

  const scrollToQuestion = (questionId: number) => {
    const el = document.getElementById(`question-${questionId}`) || document.getElementById(`review-question-${questionId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
        {stimulus.questionGroups.map((group, gi) => (
          <div key={group.id} className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                Nhóm {gi + 1}
              </span>
              <span className="h-px flex-1 bg-slate-100" />
              {group.questionTypeCode && (
                <span className="text-[10px] text-slate-400 font-bold uppercase">{getQuestionTypeLabel(group.questionTypeCode)}</span>
              )}
            </div>
            
            {group.instruction && (
              <p className="text-[13px] text-slate-500 italic mb-6 leading-relaxed">
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

      {/* Navigation Bar */}
      <div className="shrink-0 bg-white border-t border-slate-100 p-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
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
                onClick={() => scrollToQuestion(q.id)}
                className={`w-8 h-8 rounded-full text-[11px] font-black transition-all border flex items-center justify-center ${
                  isSkipped
                    ? 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
                    : isCorrect
                    ? 'bg-green-50 border-green-200 text-green-600'
                    : 'bg-red-50 border-red-200 text-red-500'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
