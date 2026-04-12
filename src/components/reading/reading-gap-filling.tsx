'use client';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useRef, useState, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import React from 'react';
import type { QuestionDetail } from '@/types/test.types';

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
function ExamInlineGapInput({ questionId, userAnswer, submitted, correctAnswer, displayNumber, onTextAnswer }: {
  questionId: number; userAnswer: string; submitted: boolean; correctAnswer: string; displayNumber?: number;
  onTextAnswer: (questionId: number, text: string) => void;
}) {
  const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
  const wrong = submitted && userAnswer.trim() !== '' && !isAnswerCorrect(userAnswer, correctAnswer);
  const hasAnswer = userAnswer.trim().length > 0;
  const isBlank = userAnswer.trim().length === 0;
  const primaryCorrect = correctAnswer.split('|')[0];

  // Calculate input width based on content
  const minLength = 80;
  const charWidth = 8;
  const inputWidth = Math.max(minLength, userAnswer.length * charWidth + 32);

  if (!submitted) {
    return (
      <span className="relative inline-block align-middle" style={{ minWidth: `${minLength}px`, width: isBlank ? `${minLength}px` : `${inputWidth}px`, maxWidth: '400px' }}>
        <input
          type="text"
          value={userAnswer}
          disabled={submitted}
          onChange={e => onTextAnswer(questionId, e.target.value)}
          className={`w-full rounded-sm border bg-white px-2 text-center text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 transition-all ${
            hasAnswer ? 'border-blue-600 bg-white' : 'border-gray-300 focus:border-blue-600 focus:ring-blue-200'
          }`}
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

  // Submitted - show inline with correct answer only (no duplicate)
  const underlineColor = wrong ? 'border-red-500' : 'border-gray-300';
  
  return (
    <span className={`inline-block border-b-2 pb-0.5 ${underlineColor}`}>
      <span className="inline-flex items-baseline gap-0 align-baseline">
        {wrong ? (
          // Wrong answer: show red strikethrough
          <span className="text-sm font-medium text-red-700 line-through px-1">
            {userAnswer}
          </span>
        ) : isBlank ? (
          // Blank: show X mark in gray
          <span className="inline-flex items-center justify-center w-[32px] h-5 text-gray-400 text-sm">
            ✕
          </span>
        ) : (
          // Correct: show in dark
          <span className="text-sm font-medium text-gray-900 px-1">
            {userAnswer}
          </span>
        )}
        
        {/* Show correct answer inline when wrong or blank */}
        {!correct && (
          <span className="text-sm font-semibold text-green-600 px-1">
            {primaryCorrect}
          </span>
        )}
      </span>
    </span>
  );
}

/** IELTS-style sentence gap-filling for exam mode */
function IELTSBoxedGapFilling({ questions, submitted, textAnswers, onTextAnswer, questionPositionById = {} }: {
  questions: QuestionDetail[];
  submitted: boolean;
  textAnswers: Record<number, string>;
  onTextAnswer: (questionId: number, text: string) => void;
  questionPositionById?: Record<number, number>;
  onLocateEvidence?: (evidence: string) => void;
  examMode?: boolean;
}) {
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

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
              />
              {parsed.after}
            </>
          ) : (
            question.content
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
            />
          </>
        )}
      </div>

      {submitted && question.explanation?.text && (
        <div className="mt-2 ml-5 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600"><strong>Giải thích:</strong> {question.explanation.text}</p>
          {question.explanation.evidence && (
            <div className="space-y-1 mt-1">
              {question.explanation.evidence.split('\n---\n').filter((e: string) => e.trim()).map((chunk: string, i: number) => (
                <p key={i} className={`text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded ${onLocateEvidence ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                  onClick={() => onLocateEvidence?.(chunk.trim())}>
                  Dẫn chứng {i + 1}: &ldquo;{chunk.trim()}&rdquo;
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
// A robust approach to replace TipTap HTML with portal targets
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHtml = /<[a-z][\s\S]*>/i.test(groupContent);

  const processedHtml = useMemo(() => {
    if (!isHtml) return groupContent;
    let gapIndex = 0;
    // Replace 2 or more underscores with a span that portal can attach to
    return groupContent.replace(/__+/g, () => {
      const currentIdx = gapIndex++;
      return `<span data-gap-index="${currentIdx}" class="inline-gap-portal inline-flex items-baseline mx-1"></span>`;
    });
  }, [groupContent, isHtml]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isHtml) {
    return (
      <div className={`bg-white p-4 ${examMode ? 'text-[13px] leading-7' : 'text-sm leading-8'} text-gray-900 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-bold [&_em]:italic [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_table]:w-full [&_table]:my-4 [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_td_p]:m-0`}>
        <div ref={containerRef} dangerouslySetInnerHTML={{ __html: processedHtml }} />
        
        {mounted && containerRef.current && sortedQuestions.map((question, index) => {
          const domElement = containerRef.current!.querySelector(`[data-gap-index="${index}"]`);
          if (!domElement) return null;
          
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
              />
            </React.Fragment>,
            domElement
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
      <span key={`q-${gapIndex}`} id={`question-${question.id}`} className="inline-flex items-baseline gap-0.5 mx-0.5">
        <ExamInlineGapInput 
          questionId={question.id} 
          userAnswer={userAnswer} 
          submitted={submitted}
          correctAnswer={correctAnswer} 
          onTextAnswer={onTextAnswer}
          displayNumber={displayNum}
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
  // Detect if groupContent is TipTap HTML (new format)
  const hasHtmlGroupContent = !!groupContent && /\<[a-z][\s\S]*\>/i.test(groupContent);

  // Sentence questions: have content (with {{answer}} or text)
  // Paragraph questions: empty content OR tagged with gapMode='paragraph'
  const sentenceQs = questions.filter(q => q.content.trim());
  const paragraphQs = questions.filter(q => !q.content.trim());

  // ── NEW: TipTap HTML group content → always use ParagraphGapFilling for ALL questions ──
  // (the passage HTML has __ for every gap, so we match by position order)
  if (hasHtmlGroupContent) {
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

  // ── LEGACY: For exam mode with sentence questions, use inline sentence gaps ──
  if (examMode && sentenceQs.length > 0) {
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
          questions={sentenceQs}
          submitted={submitted}
          textAnswers={textAnswers}
          onTextAnswer={onTextAnswer}
          questionPositionById={questionPositionById}
        />

        {/* Paragraph with inline gaps */}
        {groupContent && paragraphQs.length > 0 && (
          <ParagraphGapFilling
            groupContent={groupContent}
            questions={paragraphQs}
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
      {sentenceQs.map(question => (
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
      {groupContent && paragraphQs.length > 0 && (
        <ParagraphGapFilling
          groupContent={groupContent}
          questions={paragraphQs}
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

