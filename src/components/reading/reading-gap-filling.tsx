'use client';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { useEffect, useRef, useState, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import React from 'react';
import type { QuestionDetail } from '@/types/test.types';

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

interface Props {
  questions: QuestionDetail[];
  groupContent?: string;
  imageUrl?: string;
  submitted: boolean;
  textAnswers: Record<number, string>;
  onTextAnswer: (questionId: number, text: string) => void;
  questionPositionById?: Record<number, number>;
  onLocateEvidence?: (evidence: string) => void;
  examMode?: boolean;
}

function isAnswerCorrect(userAnswer: string, correctContent: string): boolean {
  const acceptedAnswers = correctContent.split('|').map(a => a.trim().toLowerCase());
  return acceptedAnswers.includes(userAnswer.trim().toLowerCase());
}

/** Parse question content with {{answer}} marker into parts */
function parseGapContent(content: string): { before: string; answer: string; after: string } | null {
  const match = content.match(/^([\s\S]*?)\{\{(.+?)\}\}([\s\S]*)$/);
  if (match) return { before: match[1], answer: match[2], after: match[3] };

  // Fallback to matching literal underscores (e.g. ___)
  const underMatch = content.match(/^([\s\S]*?)_{2,}([\s\S]*)$/);
  if (underMatch) return { before: underMatch[1], answer: '', after: underMatch[2] };

  return null;
}

/** Inline gap input */
function GapInput({ questionId, userAnswer, submitted, correctAnswer, onTextAnswer, compact = true }: {
  questionId: number; userAnswer: string; submitted: boolean; correctAnswer: string;
  onTextAnswer: (questionId: number, text: string) => void;
  compact?: boolean;
}) {
  const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
  const wrong = submitted && userAnswer.trim() !== '' && !isAnswerCorrect(userAnswer, correctAnswer);
  const hasAnswer = userAnswer.trim().length > 0;
  const primaryCorrect = correctAnswer.split('|')[0];

  const minLength = compact ? 30 : 50;
  const charWidth = 7;
  const inputWidth = Math.max(minLength, userAnswer.length * charWidth + 16);

  if (!submitted) {
    return (
      <input
        type="text"
        value={userAnswer}
        disabled={submitted}
        placeholder="..."
        onChange={e => onTextAnswer(questionId, e.target.value)}
        className={`inline-block bg-transparent px-1 py-0.5 outline-none text-left align-baseline border-b-2 ${
          hasAnswer ? 'border-blue-600 text-gray-900 font-medium'
          : 'border-gray-300 focus:border-blue-600'
        } ${compact ? 'text-sm' : 'text-base'}`}
        style={{ width: `${inputWidth}px`, minWidth: `${minLength}px` }}
      />
    );
  }

  // Submitted - show inline with correct answer, wrapped with underline
  const underlineColor = wrong ? 'border-red-500' : 'border-gray-300';
  const isBlank = userAnswer.trim().length === 0;

  return (
    <span className={`inline-block border-b-2 pb-0.5 ${underlineColor}`}>
      <span className="inline-flex items-baseline gap-0 align-baseline">
        {/* User's answer as text */}
        <span className={`px-1 ${compact ? 'text-sm' : 'text-base'} ${
          wrong ? 'text-red-700 line-through font-medium'
            : isBlank ? 'text-gray-400 text-lg font-bold'
            : 'text-gray-900 font-medium'
        }`}>
          {isBlank ? '✕' : userAnswer}
        </span>

        {/* Show correct answer inline when wrong or blank */}
        {!correct && (
          <span className={`text-sm font-semibold text-green-600 ${compact ? 'text-sm' : 'text-base'}`}>
            {primaryCorrect}
          </span>
        )}
      </span>
    </span>
  );
}

/** IELTS-style inline gap input for exam mode */
function ExamInlineGapInput({ questionId, userAnswer, submitted, correctAnswer, displayNumber, onTextAnswer, onLocateEvidence, evidence, explanationText }: {
  questionId: number; userAnswer: string; submitted: boolean; correctAnswer: string; displayNumber?: number;
  onTextAnswer: (questionId: number, text: string) => void;
  onLocateEvidence?: (evidence: string) => void;
  evidence?: string;
  explanationText?: string;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
  const wrong = submitted && userAnswer.trim() !== '' && !isAnswerCorrect(userAnswer, correctAnswer);
  const hasAnswer = userAnswer.trim().length > 0;
  const isBlank = userAnswer.trim().length === 0;
  const primaryCorrect = correctAnswer.split('|')[0];

  // Remove "Câu X - Giải thích đáp án" prefix from explanation text
  const cleanExplanation = explanationText?.replace(/^Câu\s+\d+\s*[-–—]\s*Giải thích đáp án\s*/i, '') || explanationText;

  // Calculate input width based on content
  const minLength = 80;
  const charWidth = 8;
  const inputWidth = Math.max(minLength, userAnswer.length * charWidth + 32);

  if (!submitted) {
    return (
      <span className="relative inline-block align-middle mx-1" style={{ minWidth: `${minLength}px`, width: isBlank ? `${minLength}px` : `${inputWidth}px`, maxWidth: '400px' }}>
        <input
          type="text"
          value={userAnswer}
          disabled={submitted}
          onChange={e => onTextAnswer(questionId, e.target.value)}
          className={`w-full rounded border-2 bg-white px-2 text-center text-sm font-semibold text-gray-900 shadow-sm focus:outline-none focus:ring-2 transition-all ${
            hasAnswer ? 'border-blue-500 shadow-blue-50' : 'border-gray-300 focus:border-blue-600 focus:ring-blue-100'
          }`}
          style={{ height: '26px', lineHeight: '26px' }}
          placeholder=""
        />
        {!submitted && isBlank && displayNumber != null && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600/70" style={{ lineHeight: '26px' }}>
            {displayNumber}
          </span>
        )}
      </span>
    );
  }

  // Submitted - show inline with correct answer only (no duplicate)
  const underlineColor = wrong ? 'border-red-500' : 'border-gray-300';

  return (
    <span className={`inline-block border-b-2 pb-0.5 ${underlineColor}`}>
      <span className="inline-flex items-center gap-1 align-baseline">
        {wrong ? (
          <span className="inline-flex items-baseline gap-1 px-1 text-sm font-medium">
            <span className="text-red-600">{userAnswer}</span>
            <span className="text-gray-500 px-0.5">→</span>
            <span className="text-green-600">{primaryCorrect}</span>
          </span>
        ) : isBlank ? (
          <span className="inline-flex items-baseline gap-1 px-1 text-sm font-medium">
            <span className="text-gray-400 font-bold">✕</span>
            <span className="text-gray-500 px-0.5">→</span>
            <span className="text-green-600">{primaryCorrect}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1 text-sm font-medium text-green-600">
            {userAnswer}
          </span>
        )}

        {submitted && (
          <span className="inline-flex items-center gap-1 ml-1 shrink-0">
            {evidence && onLocateEvidence && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLocateEvidence?.(evidence);
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
                title="Xem dẫn chứng"
              >
                <TargetIcon className="h-4 w-4 text-gray-900" strokeWidth={2} />
              </button>
            )}
            {explanationText && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowExplanation(!showExplanation);
                }}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  showExplanation ? 'bg-yellow-200 hover:bg-yellow-300' : 'bg-yellow-100 hover:bg-yellow-200'
                }`}
                title="Xem giải thích"
              >
                <Lightbulb className={`h-4 w-4 ${showExplanation ? 'text-yellow-800' : 'text-yellow-700'}`} />
              </button>
            )}
          </span>
        )}
      </span>
      {showExplanation && cleanExplanation && (
        <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded px-3 py-2 w-full">
          {cleanExplanation}
        </div>
      )}
    </span>
  );
}

/** IELTS-style sentence gap-filling for exam mode */
function IELTSBoxedGapFilling({ questions, submitted, textAnswers, onTextAnswer, questionPositionById = {}, onLocateEvidence, examMode = false }: {
  questions: QuestionDetail[];
  submitted: boolean;
  textAnswers: Record<number, string>;
  onTextAnswer: (questionId: number, text: string) => void;
  questionPositionById?: Record<number, number>;
  onLocateEvidence?: (evidence: string) => void;
  examMode?: boolean;
}) {
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});

  // Helper to replace {{answer}} with ________
  const formatContent = (content: string) => {
    return content.replace(/\{\{.*?\}\}/g, '__________');
  };

  return (
    <div className="bg-white p-5">
      <div className="space-y-2">
        {sortedQuestions.map((q) => {
          const userAnswer = textAnswers[q.id] ?? '';

          return (
            <div key={q.id} className="py-1 border-b border-gray-100 last:border-0">
              <p className="text-sm text-gray-800 font-normal leading-7">
                {(() => {
                  const parsed = parseGapContent(q.content);
                  if (!parsed) {
                    return formatContent(q.content);
                  }

                  const correctAnswer = q.options.find(o => o.isCorrect)?.content ?? '';

                  return (
                    <>
                      {parsed.before}
                      <ExamInlineGapInput
                        questionId={q.id}
                        userAnswer={userAnswer}
                        submitted={submitted}
                        correctAnswer={correctAnswer}
                        displayNumber={questionPositionById[q.id] ?? q.position}
                        onTextAnswer={onTextAnswer}
                        onLocateEvidence={onLocateEvidence}
                        evidence={q.explanation?.evidence}
                        explanationText={q.explanation?.text}
                      />
                      {parsed.after}
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

/** Renders a single gap-fill question as inline sentence with blank */
function GapQuestion({ question, displayPosition, userAnswer, submitted, onTextAnswer, onLocateEvidence, examMode = false }: {
  question: QuestionDetail; userAnswer: string; submitted: boolean;
  displayPosition: number;
  onTextAnswer: (questionId: number, text: string) => void;
  onLocateEvidence?: (evidence: string) => void;
  examMode?: boolean;
}) {
  const [showExp, setShowExp] = useState(false);
  const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
  const primaryCorrect = correctAnswer.split('|')[0];
  const parsed = parseGapContent(question.content);
  const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
  const wrong = submitted && userAnswer.trim() !== '' && !correct;

  // Use inline sentence gaps for exam mode
  if (examMode) {
    return (
      <div id={`question-${question.id}`} className="bg-white p-5">
        <p className="text-sm text-gray-800 font-normal leading-8">
          {parsed ? (
            <>
              {parsed.before}
              <ExamInlineGapInput
                questionId={question.id}
                userAnswer={userAnswer}
                submitted={submitted}
                correctAnswer={correctAnswer}
                displayNumber={displayPosition}
                onTextAnswer={onTextAnswer}
                onLocateEvidence={onLocateEvidence}
                evidence={question.explanation?.evidence}
                explanationText={question.explanation?.text}
              />
              {parsed.after}
            </>
          ) : (
            <>
              <span className="font-bold mr-2">{displayPosition}.</span>
              {question.content}
              <ExamInlineGapInput
                questionId={question.id}
                userAnswer={userAnswer}
                submitted={submitted}
                correctAnswer={correctAnswer}
                displayNumber={displayPosition}
                onTextAnswer={onTextAnswer}
                onLocateEvidence={onLocateEvidence}
                evidence={question.explanation?.evidence}
                explanationText={question.explanation?.text}
              />
            </>
          )}
        </p>
      </div>
    );
  }

  // Non-exam mode: inline layout with answer shown inline
  const compact = examMode ?? true;

  return (
    <div id={`question-${question.id}`} className={`rounded-lg bg-white p-4 ${compact ? 'shadow-sm' : ''}`}>
      <div className={`${compact ? 'text-[13px] leading-7' : 'text-sm leading-8'} text-gray-900`}>
        <span className="mr-1 font-bold">{displayPosition}.</span>
        {parsed ? (
          <>
            {parsed.before}
            <ExamInlineGapInput
              questionId={question.id}
              userAnswer={userAnswer}
              submitted={submitted}
              correctAnswer={correctAnswer}
              displayNumber={displayPosition}
              onTextAnswer={onTextAnswer}
              onLocateEvidence={onLocateEvidence}
              evidence={question.explanation?.evidence}
              explanationText={question.explanation?.text}
            />
            {parsed.after}
          </>
        ) : (
          <>
            {question.content}
            <ExamInlineGapInput
              questionId={question.id}
              userAnswer={userAnswer}
              submitted={submitted}
              correctAnswer={correctAnswer}
              displayNumber={displayPosition}
              onTextAnswer={onTextAnswer}
              onLocateEvidence={onLocateEvidence}
              evidence={question.explanation?.evidence}
              explanationText={question.explanation?.text}
            />
          </>
        )}
      </div>
    </div>
  );
}

/** A stable wrapper for HTML that doesn't re-render unless content changes */
const StaticHtml = React.memo(({ html, containerRef, className }: { html: string; containerRef: React.RefObject<HTMLDivElement | null>; className: string }) => (
  <div ref={containerRef as any} className={className} dangerouslySetInnerHTML={{ __html: html }} />
));

/** Render groupContent (HTML from TipTap) with inline blanks replacing __ markers */
function ParagraphGapFilling({ groupContent, questions, submitted, textAnswers, onTextAnswer, questionPositionById = {}, onLocateEvidence, examMode = false }: {
  groupContent: string;
  questions: QuestionDetail[];
  submitted: boolean;
  textAnswers: Record<number, string>;
  onTextAnswer: (questionId: number, text: string) => void;
  questionPositionById?: Record<number, number>;
  onLocateEvidence?: (evidence: string) => void;
  examMode?: boolean;
}) {
  const sortedQuestions = useMemo(() => [...questions].sort((a, b) => a.position - b.position), [questions]);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalTargets, setPortalTargets] = useState<Array<{ element: HTMLElement; question: QuestionDetail }>>([]);
  const isHtml = /<[a-z][\s\S]*>/i.test(groupContent);

  const processedHtml = useMemo(() => {
    if (!isHtml) return groupContent;
    let gapIndex = 0;
    return groupContent.replace(/_{2,}/g, () => {
      const currentIdx = gapIndex++;
      return `<span data-gap-index="${currentIdx}" class="inline-gap-portal inline-flex items-center min-w-[80px] min-h-[28px] mx-1"></span>`;
    });
  }, [groupContent, isHtml]);

  useEffect(() => {
    setMounted(true);
    if (!isHtml || !containerRef.current) return;

    const found: typeof portalTargets = [];
    sortedQuestions.forEach((q, index) => {
      const el = containerRef.current?.querySelector(`[data-gap-index="${index}"]`);
      if (el instanceof HTMLElement) {
        found.push({ element: el, question: q });
      }
    });

    if (found.length > 0) {
      setPortalTargets(found);
    }
  }, [processedHtml, sortedQuestions, isHtml]);

  if (isHtml) {
    const containerClasses = `bg-white p-4 ${examMode ? 'text-[13px] leading-7' : 'text-sm leading-8'} text-gray-900 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-bold [&_em]:italic [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_table]:w-full [&_table]:my-4 [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_td_p]:m-0`;

    return (
      <div className="relative">
        <StaticHtml
          html={processedHtml}
          containerRef={containerRef}
          className={containerClasses}
        />

        {mounted && portalTargets.map(({ element, question }) => {
          const displayNum = questionPositionById[question.id] ?? question.position;
          const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
          const userAnswer = textAnswers[question.id] ?? '';

          return createPortal(
            <React.Fragment key={question.id}>
              <ExamInlineGapInput
                questionId={question.id}
                userAnswer={userAnswer}
                submitted={submitted}
                correctAnswer={correctAnswer}
                displayNumber={displayNum}
                onTextAnswer={onTextAnswer}
                onLocateEvidence={onLocateEvidence}
                evidence={question.explanation?.evidence}
                explanationText={question.explanation?.text}
              />
            </React.Fragment>,
            element
          );
        })}
      </div>
    );
  }

  // ── Legacy plain-text format with [N]___ or numeric patterns ──
  const pattern = /\[(\d+)\]_{2,}|(\d+)\s*(?:\.{2,}|…+|_{2,})/g;
  const matches = [...groupContent.matchAll(pattern)];
  const rendered: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, gapIndex) => {
    const question = sortedQuestions[gapIndex];
    if (!question) return;

    if (match.index! > lastIndex) {
      rendered.push(<span key={`t-${lastIndex}`}>{groupContent.slice(lastIndex, match.index!)}</span>);
    }

    const displayNum = questionPositionById[question.id] ?? question.position;
    const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
    const userAnswer = textAnswers[question.id] ?? '';
    rendered.push(
      <span key={`q-${gapIndex}`} id={`question-${question.id}`} className="inline-flex items-baseline gap-1 mx-0.5">
        <ExamInlineGapInput
          questionId={question.id}
          userAnswer={userAnswer}
          submitted={submitted}
          correctAnswer={correctAnswer}
          onTextAnswer={onTextAnswer}
          displayNumber={displayNum}
          onLocateEvidence={onLocateEvidence}
          evidence={question.explanation?.evidence}
          explanationText={question.explanation?.text}
        />
      </span>
    );
    lastIndex = match.index! + match[0].length;
  });

  if (lastIndex < groupContent.length) {
    rendered.push(<span key={`t-${lastIndex}`}>{groupContent.slice(lastIndex)}</span>);
  }

  return (
    <div className={`bg-white p-4 space-y-4 ${examMode ? 'text-[13px]' : ''}`}>
      <div className={`text-gray-900 ${examMode ? 'leading-7' : 'text-sm leading-8'}`}>{rendered}</div>
    </div>
  );
}




export function ReadingGapFilling({
  questions,
  groupContent,
  imageUrl,
  submitted,
  textAnswers,
  onTextAnswer,
  questionPositionById = {},
  onLocateEvidence,
  examMode,
}: Props) {
  // Detect if groupContent exists and has placeholders
  const hasGroupContent = !!groupContent && groupContent.includes('__');

  // ── NEW: If groupContent has placeholders, ALWAYS use ParagraphGapFilling for ALL questions ──
  // (the passage HTML has __ for every gap, so we match by position order)
  if (hasGroupContent) {
    return (
      <div className="space-y-4">
        {imageUrl && (
          <div className="rounded-lg p-3 bg-white border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Diagram" className="max-w-full h-auto rounded" loading="lazy" />
          </div>
        )}
        <ParagraphGapFilling
          groupContent={groupContent!}
          questions={questions}
          submitted={submitted}
          textAnswers={textAnswers}
          onTextAnswer={onTextAnswer}
          questionPositionById={questionPositionById}
          onLocateEvidence={onLocateEvidence}
          examMode={examMode}
        />
      </div>
    );
  }

  // ── LEGACY: For groups without passage (just list of sentences) ──
  if (examMode) {
    return (
      <div className="space-y-4">
        {imageUrl && (
          <div className="rounded-lg p-3 bg-white border border-gray-200">
            {/* Use plain <img> so remote diagram URLs work without Next image host config. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Diagram"
              className="max-w-full h-auto rounded"
              loading="lazy"
            />
          </div>
        )}

        <IELTSBoxedGapFilling
          questions={questions}
          submitted={submitted}
          textAnswers={textAnswers}
          onTextAnswer={onTextAnswer}
          questionPositionById={questionPositionById}
        />

        {/* Fallback - should not happen if hasGroupContent is true above */}
        {groupContent && (
          <ParagraphGapFilling
            groupContent={groupContent}
            questions={questions}
            submitted={submitted}
            textAnswers={textAnswers}
            onTextAnswer={onTextAnswer}
            questionPositionById={questionPositionById}
            onLocateEvidence={onLocateEvidence}
            examMode={examMode}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {imageUrl && (
        <div className="rounded-lg p-3">
          {/* Use plain <img> so remote diagram URLs work without Next image host config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Diagram"
            className="max-w-full h-auto rounded"
            loading="lazy"
          />
        </div>
      )}

      {/* Sentence questions */}
      {questions.map(question => (
        <GapQuestion
          key={question.id}
          question={question}
          displayPosition={questionPositionById[question.id] ?? question.position}
          userAnswer={textAnswers[question.id] ?? ''}
          submitted={submitted}
          onTextAnswer={onTextAnswer}
          onLocateEvidence={onLocateEvidence}
          examMode={examMode}
        />
      ))}

      {/* Paragraph with inline gaps */}
      {groupContent && (
        <ParagraphGapFilling
          groupContent={groupContent}
          questions={questions}
          submitted={submitted}
          textAnswers={textAnswers}
          onTextAnswer={onTextAnswer}
          questionPositionById={questionPositionById}
          onLocateEvidence={onLocateEvidence}
          examMode={examMode}
        />
      )}
    </div>
  );
}

