'use client';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import type { QuestionDetail } from '@/types/test.types';

// Custom Target/Aim icon component - bullseye style
function TargetIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <span className="inline-flex items-baseline gap-1 align-baseline">
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
          <span className="text-sm font-medium text-green-600 px-1">
            {userAnswer}
          </span>
        )}
      </span>
    </span>
  );
}

/** IELTS-style inline gap input for paragraph mode */
function InlineGapInput({ questionId, userAnswer, submitted, correctAnswer, onTextAnswer }: {
  questionId: number; userAnswer: string; submitted: boolean; correctAnswer: string;
  onTextAnswer: (questionId: number, text: string) => void;
}) {
  const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
  const wrong = submitted && userAnswer.trim() !== '' && !isAnswerCorrect(userAnswer, correctAnswer);
  const isBlank = userAnswer.trim().length === 0;

  const minLength = 60;
  const charWidth = 8;
  const inputWidth = Math.max(minLength, userAnswer.length * charWidth + 32);

  return (
    <span className="relative inline-block align-middle" style={{ minWidth: `${minLength}px`, width: isBlank ? `${minLength}px` : `${inputWidth}px`, maxWidth: '400px' }}>
      <input
        type="text"
        value={userAnswer}
        disabled={submitted}
        placeholder=""
        onChange={e => onTextAnswer(questionId, e.target.value)}
        className={`w-full outline-none px-2 text-center text-sm font-medium bg-transparent border-b-2 transition-all ${
          submitted && correct ? 'border-gray-900 text-gray-900 bg-gray-50'
            : submitted && wrong ? 'border-gray-500 text-gray-700 bg-red-50'
            : 'border-gray-400 focus:border-gray-900'
        }`}
        style={{ height: '20px', lineHeight: '20px' }}
      />
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
}) {
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});

  // Helper to replace {{answer}} with ________
  const formatContent = (content: string) => {
    return content.replace(/\{\{.*?\}\}/g, '__________');
  };

  return (
    <div className="bg-white p-5">
      <div className="space-y-3">
        {sortedQuestions.map((q) => {
          const userAnswer = textAnswers[q.id] ?? '';

          return (
            <div key={q.id} className="py-2 border-b border-gray-100 last:border-0">
              <p className="text-sm text-gray-800 font-normal leading-8">
                {(() => {
                  const parsed = parseGapContent(q.content);
                  if (!parsed) {
                    return formatContent(q.content);
                  }

                  const correctAnswer = q.options.find(o => o.isCorrect)?.content ?? '';
                  const displayNumber = questionPositionById[q.id] ?? q.position;
                  return (
                    <>
                      {parsed.before}
                      <ExamInlineGapInput
                        questionId={q.id}
                        userAnswer={userAnswer}
                        submitted={submitted}
                        correctAnswer={correctAnswer}
                        displayNumber={displayNumber}
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

      {/* Show results after submit */}
      {submitted && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          {sortedQuestions.map((q) => {
            const userAnswer = textAnswers[q.id] ?? '';
            const correctAnswer = q.options.find(o => o.isCorrect)?.content ?? '';
            const correct = isAnswerCorrect(userAnswer, correctAnswer);
            const wrong = userAnswer.trim() !== '' && !correct;
            const displayPosition = questionPositionById[q.id] ?? q.position;
            const primaryCorrect = correctAnswer.split('|')[0];

            return (
              <div key={q.id} className={`flex flex-col gap-2 text-xs px-3 py-2 rounded-lg ${
                correct ? 'bg-green-50' : wrong ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 min-w-[20px]">{displayPosition}.</span>
                    {correct ? (
                      <><CheckCircle2 className="h-4 w-4 text-gray-900" /><span className="text-gray-900 font-semibold">Đúng</span></>
                    ) : wrong ? (
                      <><XCircle className="h-4 w-4 text-gray-700" /><span className="text-gray-800">Đáp án: <strong className="text-green-600">{primaryCorrect}</strong>
                        {correctAnswer.includes('|') && <span className="text-gray-500 font-normal"> (hoặc: {correctAnswer.split('|').slice(1).join(', ')})</span>}
                      </span></>
                    ) : (
                      <span className="text-gray-500 italic">Chưa trả lời — Đáp án: <strong className="text-green-600">{primaryCorrect}</strong></span>
                    )}
                  </div>
                  {q.explanation && (
                    <div className="flex items-center gap-2">
                      {q.explanation.text && (
                        <button onClick={() => setExpandedMap(prev => ({...prev, [q.id]: !prev[q.id]}))} className={`p-1.5 rounded-md transition-colors ${expandedMap[q.id] ? 'bg-yellow-100 text-yellow-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`} title="Giải thích">
                          <Lightbulb className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {expandedMap[q.id] && q.explanation?.text && (
                  <div className="mt-1 pt-2 border-t border-gray-200/50 text-gray-700">
                    <strong>Giải thích:</strong> {q.explanation.text}
                    {q.explanation.evidence && (
                      <div className="mt-1 space-y-1">
                        {q.explanation.evidence.split('\\n---\\n').filter((e: string) => e.trim()).map((chunk: string, i: number) => (
                          <p key={i} className="text-xs text-gray-600 bg-black/5 px-2 py-1 flex items-start gap-1">
                            <span>Dẫn chứng {i + 1}:</span> <span>&ldquo;{chunk.trim()}&rdquo;</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Renders a single gap-fill question as inline sentence with blank */
function GapQuestion({ question, displayPosition, userAnswer, submitted, onTextAnswer, onLocateEvidence }: {
  question: QuestionDetail; userAnswer: string; submitted: boolean;
  displayPosition: number;
  onTextAnswer: (questionId: number, text: string) => void;
  onLocateEvidence?: (evidence: string) => void;
}) {
  const [showExp, setShowExp] = useState(false);
  const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
  const primaryCorrect = correctAnswer.split('|')[0];
  const parsed = parseGapContent(question.content);
  const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
  const wrong = submitted && userAnswer.trim() !== '' && !correct;

  return (
    <div id={`question-${question.id}`} className="mb-4 bg-white p-4 rounded-lg border border-gray-200">
      <div className="text-sm text-gray-900 leading-8">
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
            <span className="font-bold mr-2">{displayPosition}.</span>
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

      {submitted && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div className={`flex flex-col gap-2 text-xs px-3 py-2 rounded-lg ${
            correct ? 'bg-green-50' : wrong ? 'bg-red-50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 min-w-[20px]">{displayPosition}.</span>
                {correct ? (
                  <><CheckCircle2 className="h-4 w-4 text-gray-900" /><span className="text-gray-900 font-semibold">Đúng</span></>
                ) : wrong ? (
                  <><XCircle className="h-4 w-4 text-gray-700" /><span className="text-gray-800">Đáp án: <strong className="text-green-600">{primaryCorrect}</strong>
                    {correctAnswer.includes('|') && <span className="text-gray-500 font-normal"> (hoặc: {correctAnswer.split('|').slice(1).join(', ')})</span>}
                  </span></>
                ) : (
                  <span className="text-gray-500 italic">Chưa trả lời — Đáp án: <strong className="text-green-600">{primaryCorrect}</strong></span>
                )}
              </div>
              {question.explanation && (
                <div className="flex items-center gap-2">
                  {question.explanation.text && (
                    <button onClick={() => setShowExp(!showExp)} className={`p-1.5 rounded-md transition-colors ${showExp ? 'bg-yellow-100 text-yellow-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`} title="Giải thích">
                      <Lightbulb className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {showExp && question.explanation?.text && (
              <div className="mt-1 pt-2 border-t border-gray-200/50 text-gray-700">
                <strong>Giải thích:</strong> {question.explanation.text}
                {question.explanation.evidence && (
                  <div className="mt-1 space-y-1">
                    {question.explanation.evidence.split('\\n---\\n').filter((e: string) => e.trim()).map((chunk: string, i: number) => (
                      <p key={i} className="text-xs text-gray-600 bg-black/5 px-2 py-1 flex items-start gap-1">
                        <span>Dẫn chứng {i + 1}:</span> <span>&ldquo;{chunk.trim()}&rdquo;</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** A stable wrapper for HTML that doesn't re-render unless content changes */
const StaticHtml = React.memo(({ html, containerRef, className }: { html: string; containerRef: React.RefObject<HTMLDivElement | null>; className: string }) => (
  <div ref={containerRef as any} className={className} dangerouslySetInnerHTML={{ __html: html }} />
));

/** Render groupContent paragraph with inline blanks */
function ParagraphGapFilling({ groupContent, questions, submitted, textAnswers, onTextAnswer, questionPositionById = {}, examMode }: {
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
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
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
    const containerClasses = `bg-white p-5 text-gray-900 leading-8 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-bold [&_em]:italic [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_table]:w-full [&_table]:my-4 [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_td_p]:m-0`;
    
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
              />
            </React.Fragment>,
            element
          );
        })}

        {/* Show results after submit */}
        {submitted && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            {sortedQuestions.map((q) => {
              const userAnswer = textAnswers[q.id] ?? '';
              const correctAnswer = q.options.find(o => o.isCorrect)?.content ?? '';
              const correct = isAnswerCorrect(userAnswer, correctAnswer);
              const wrong = userAnswer.trim() !== '' && !correct;
              const displayPosition = questionPositionById[q.id] ?? q.position;
              const primaryCorrect = correctAnswer.split('|')[0];

              return (
                <div key={q.id} className={`flex flex-col gap-2 text-xs px-3 py-2 rounded-lg ${
                  correct ? 'bg-green-50' : wrong ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 min-w-[20px]">{displayPosition}.</span>
                      {correct ? (
                        <><CheckCircle2 className="h-4 w-4 text-gray-900" /><span className="text-gray-900 font-semibold">Đúng</span></>
                      ) : wrong ? (
                        <><XCircle className="h-4 w-4 text-gray-700" /><span className="text-gray-800">Đáp án: <strong className="text-green-600">{primaryCorrect}</strong>
                          {correctAnswer.includes('|') && <span className="text-gray-500 font-normal"> (hoặc: {correctAnswer.split('|').slice(1).join(', ')})</span>}
                        </span></>
                      ) : (
                        <span className="text-gray-500 italic">Chưa trả lời — Đáp án: <strong className="text-green-600">{primaryCorrect}</strong></span>
                      )}
                    </div>
                    {q.explanation && (
                      <div className="flex items-center gap-2">
                        {q.explanation.text && (
                          <button onClick={() => setExpandedMap(prev => ({...prev, [q.id]: !prev[q.id]}))} className={`p-1.5 rounded-md transition-colors ${expandedMap[q.id] ? 'bg-yellow-100 text-yellow-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`} title="Giải thích">
                            <Lightbulb className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {expandedMap[q.id] && q.explanation?.text && (
                    <div className="mt-1 pt-2 border-t border-gray-200/50 text-gray-700">
                      <strong>Giải thích:</strong> {q.explanation.text}
                      {q.explanation.evidence && (
                        <div className="mt-1 space-y-1">
                          {q.explanation.evidence.split('\\n---\\n').filter((e: string) => e.trim()).map((chunk: string, i: number) => (
                            <p key={i} className="text-xs text-gray-600 bg-black/5 px-2 py-1 flex items-start gap-1">
                              <span>Dẫn chứng {i + 1}:</span> <span>&ldquo;{chunk.trim()}&rdquo;</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

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
            displayNumber={displayNum}
            onTextAnswer={onTextAnswer}
          />
      </span>
    );
    lastIndex = match.index! + match[0].length;
  });

  if (lastIndex < groupContent.length) {
    rendered.push(<span key={`t-${lastIndex}`}>{groupContent.slice(lastIndex)}</span>);
  }

  return (
    <div className="bg-white p-5">
      <div className="text-sm text-gray-900 leading-8 mb-4">{rendered}</div>

      {/* Show results after submit */}
      {submitted && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          {sortedQuestions.map((q) => {
            const userAnswer = textAnswers[q.id] ?? '';
            const correctAnswer = q.options.find(o => o.isCorrect)?.content ?? '';
            const correct = isAnswerCorrect(userAnswer, correctAnswer);
            const wrong = userAnswer.trim() !== '' && !correct;
            const displayPosition = questionPositionById[q.id] ?? q.position;
            const primaryCorrect = correctAnswer.split('|')[0];

            return (
              <div key={q.id} className={`flex flex-col gap-2 text-xs px-3 py-2 rounded-lg ${
                correct ? 'bg-green-50' : wrong ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 min-w-[20px]">{displayPosition}.</span>
                    {correct ? (
                      <><CheckCircle2 className="h-4 w-4 text-gray-900" /><span className="text-gray-900 font-semibold">Đúng</span></>
                    ) : wrong ? (
                      <><XCircle className="h-4 w-4 text-gray-700" /><span className="text-gray-800">Đáp án: <strong className="text-green-600">{primaryCorrect}</strong>
                        {correctAnswer.includes('|') && <span className="text-gray-500 font-normal"> (hoặc: {correctAnswer.split('|').slice(1).join(', ')})</span>}
                      </span></>
                    ) : (
                      <span className="text-gray-500 italic">Chưa trả lời — Đáp án: <strong className="text-green-600">{primaryCorrect}</strong></span>
                    )}
                  </div>
                  {q.explanation && (
                    <div className="flex items-center gap-2">
                      {q.explanation.text && (
                        <button onClick={() => setExpandedMap(prev => ({...prev, [q.id]: !prev[q.id]}))} className={`p-1.5 rounded-md transition-colors ${expandedMap[q.id] ? 'bg-yellow-100 text-yellow-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`} title="Giải thích">
                          <Lightbulb className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {expandedMap[q.id] && q.explanation?.text && (
                  <div className="mt-1 pt-2 border-t border-gray-200/50 text-gray-700">
                    <strong>Giải thích:</strong> {q.explanation.text}
                    {q.explanation.evidence && (
                      <div className="mt-1 space-y-1">
                        {q.explanation.evidence.split('\\n---\\n').filter((e: string) => e.trim()).map((chunk: string, i: number) => (
                          <p key={i} className="text-xs text-gray-600 bg-black/5 px-2 py-1 flex items-start gap-1">
                            <span>Dẫn chứng {i + 1}:</span> <span>&ldquo;{chunk.trim()}&rdquo;</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ListeningGapFilling({
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
  if (hasGroupContent) {
    return (
      <div className="space-y-4">
        {imageUrl && (
          <div className="rounded-lg p-3 mb-4 bg-white border border-gray-200">
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

  // ── LEGACY: For groups without passage (just list of questions) ──
  if (examMode) {
    return (
      <div className="space-y-4">
        {imageUrl && (
          <div className="rounded-lg p-3 mb-4 bg-white border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Diagram" className="max-w-full h-auto rounded" loading="lazy" />
          </div>
        )}

        <IELTSBoxedGapFilling
          questions={questions}
          submitted={submitted}
          textAnswers={textAnswers}
          onTextAnswer={onTextAnswer}
          questionPositionById={questionPositionById}
          onLocateEvidence={onLocateEvidence}
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
