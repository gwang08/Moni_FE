'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReadingQuestionMcq } from '@/components/reading/reading-question-mcq';
import { ReadingGapFilling } from '@/components/reading/reading-gap-filling';
import type { StimulusDetail, QuestionDetail, QuestionGroupDetail } from '@/types/test.types';

const GAP_TYPES = ['GAP_FILLING', 'DIAGRAM_LABEL'];
const MCQ_TYPES = ['MCQ', 'MCQ_MULTIPLE', 'TFNG', 'YNNG'];
const MATCHING_TYPES = ['MATCHING_HEADINGS', 'MATCHING_INFORMATION', 'MATCHING_FEATURE'];

interface Props {
  stimulus: StimulusDetail;
  answers: Record<number, number>;
  textAnswers?: Record<number, string>;
  onLocateEvidence: (evidence: string) => void;
}

/** Matching review: statement + number + user answer (strikethrough if wrong) + correct answer */
function MatchingQuestionReview({ question, selectedOption, correctOption, isCorrect, isSkipped, onLocateEvidence }: {
  question: QuestionDetail;
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
        {question.position}
      </span>
      {/* User answer */}
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
      {/* Explanation icon */}
      {question.explanation?.text && (
        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs" title="Xem giải thích">
              💬
            </button>
          </DialogTrigger>
          <ExplanationContent question={question} onLocateEvidence={onLocateEvidence} />
        </Dialog>
      )}
    </div>
  );
}

/** Shared explanation dialog content */
function ExplanationContent({ question, onLocateEvidence }: { question: QuestionDetail; onLocateEvidence: (evidence: string) => void }) {
  return (
    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Giải thích câu {question.position}</DialogTitle>
      </DialogHeader>
      <div className="text-sm leading-relaxed space-y-2">
        {question.explanation?.text?.split(/(?=Bước \d+:)/g).map((part, i) => {
          const trimmed = part.trim();
          if (!trimmed) return null;
          const stepMatch = trimmed.match(/^(Bước \d+:)\s*([\s\S]*)/);
          if (stepMatch) {
            return (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <p className="font-semibold text-blue-600 text-xs mb-1">{stepMatch[1]}</p>
                <p className="text-gray-700 whitespace-pre-line">{stepMatch[2].replace(/\s*•\s*/g, '\n• ')}</p>
              </div>
            );
          }
          return <p key={i} className="text-gray-700 whitespace-pre-line">{trimmed}</p>;
        })}
      </div>
      {question.explanation?.evidence && (
        <div className="space-y-2 mt-3">
          {question.explanation.evidence.split('\n---\n').filter((e: string) => e.trim()).map((chunk: string, i: number) => (
            <p key={i} className="bg-amber-50 p-3 rounded border-l-4 border-amber-400 text-sm text-amber-800 cursor-pointer hover:bg-amber-100"
              onClick={() => onLocateEvidence(chunk.trim())}>
              Dẫn chứng {i + 1}: &ldquo;{chunk.trim()}&rdquo;
            </p>
          ))}
        </div>
      )}
    </DialogContent>
  );
}

/** Render a question group in review mode based on its type */
function ReviewQuestionGroup({ group, answers, textAnswers, onLocateEvidence }: {
  group: QuestionGroupDetail;
  answers: Record<number, number>;
  textAnswers: Record<number, string>;
  onLocateEvidence: (evidence: string) => void;
}) {
  const typeCode = group.questionTypeCode || '';

  // MCQ / TFNG / YNNG — use ReadingQuestionMcq in submitted mode
  if (MCQ_TYPES.includes(typeCode)) {
    return (
      <div className="space-y-3">
        {group.questions.map(q => (
          <ReadingQuestionMcq
            key={q.id}
            questionId={q.id}
            position={q.position}
            content={q.content}
            options={q.options}
            selectedId={answers[q.id]}
            submitted={true}
            explanation={q.explanation}
            onAnswer={() => {}}
          />
        ))}
      </div>
    );
  }

  // Gap Filling / Diagram Label — use ReadingGapFilling in submitted mode
  if (GAP_TYPES.includes(typeCode)) {
    return (
      <ReadingGapFilling
        questions={group.questions}
        groupContent={group.groupContent}
        imageUrl={group.imageUrl}
        submitted={true}
        textAnswers={textAnswers}
        onTextAnswer={() => {}}
      />
    );
  }

  // Matching types — inline review with strikethrough for wrong
  if (MATCHING_TYPES.includes(typeCode)) {
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

  // Fallback: generic badge style
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
              <span className="text-blue-600 font-bold mr-1">{q.position}.</span>
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
              <div className="text-sm flex gap-2 items-center">
                <span className="text-gray-500">Đáp án:</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                  {correctOption.label && `${correctOption.label}. `}{correctOption.content}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ReadingReviewPanel({ stimulus, answers, textAnswers = {}, onLocateEvidence }: Props) {
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const allQuestions = stimulus.questionGroups.flatMap(g => g.questions);

  const scrollToQuestion = (questionId: number) => {
    const el = document.getElementById(`question-${questionId}`) || document.getElementById(`review-question-${questionId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {stimulus.questionGroups.map((group, gi) => (
          <div key={group.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Nhóm {gi + 1}
              </span>
              {group.questionTypeCode && (
                <span className="text-[10px] text-gray-400">{group.questionTypeCode.replace(/_/g, ' ')}</span>
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
