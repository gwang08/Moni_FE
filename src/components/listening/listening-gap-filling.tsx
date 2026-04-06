'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import type { QuestionDetail } from '@/types/test.types';

interface Props {
  questions: QuestionDetail[];
  groupContent?: string;
  imageUrl?: string;
  submitted: boolean;
  textAnswers: Record<number, string>;
  onTextAnswer: (questionId: number, text: string) => void;
  questionPositionById?: Record<number, number>;
  examMode?: boolean;
}

function isAnswerCorrect(userAnswer: string, correctContent: string): boolean {
  const acceptedAnswers = correctContent.split('|').map(a => a.trim().toLowerCase());
  return acceptedAnswers.includes(userAnswer.trim().toLowerCase());
}

/** Parse question content with {{answer}} marker into parts */
function parseGapContent(content: string): { before: string; answer: string; after: string } | null {
  const match = content.match(/^([\s\S]*?)\{\{(.+?)\}\}([\s\S]*)$/);
  if (!match) return null;
  return { before: match[1], answer: match[2], after: match[3] };
}

/** IELTS-style inline gap input for exam mode */
function ExamInlineGapInput({ questionId, userAnswer, submitted, correctAnswer, displayNumber, onTextAnswer }: {
  questionId: number; userAnswer: string; submitted: boolean; correctAnswer: string; displayNumber?: number;
  onTextAnswer: (questionId: number, text: string) => void;
}) {
  const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
  const wrong = submitted && userAnswer.trim() !== '' && !isAnswerCorrect(userAnswer, correctAnswer);
  const isBlank = userAnswer.trim().length === 0;

  // Calculate input width based on content
  const minLength = 80;
  const charWidth = 8;
  const inputWidth = Math.max(minLength, userAnswer.length * charWidth + 32);

  return (
    <span className="relative inline-block align-middle" style={{ minWidth: `${minLength}px`, width: isBlank ? `${minLength}px` : `${inputWidth}px`, maxWidth: '400px' }}>
      <input
        type="text"
        value={userAnswer}
        disabled={submitted}
        onChange={e => onTextAnswer(questionId, e.target.value)}
        className={`w-full rounded-sm border bg-white px-2 text-center text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 transition-all ${
          submitted && correct ? 'border-gray-900 bg-gray-50'
            : submitted && wrong ? 'border-gray-500 bg-red-50'
            : 'border-gray-400 focus:border-gray-900 focus:ring-gray-200'
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
}) {
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

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
        <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
          {sortedQuestions.map((q) => {
            const userAnswer = textAnswers[q.id] ?? '';
            const correctAnswer = q.options.find(o => o.isCorrect)?.content ?? '';
            const correct = isAnswerCorrect(userAnswer, correctAnswer);
            const wrong = userAnswer.trim() !== '' && !correct;
            const displayPosition = questionPositionById[q.id] ?? q.position;
            const primaryCorrect = correctAnswer.split('|')[0];

            return (
              <div key={q.id} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${
                correct ? 'bg-green-50' : wrong ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <span className="font-bold text-gray-900 min-w-[20px]">{displayPosition}.</span>
                {correct ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-gray-900" /><span className="text-gray-900 font-semibold">Đúng</span></>
                ) : wrong ? (
                  <><XCircle className="h-3.5 w-3.5 text-gray-700" /><span className="text-gray-800">Đáp án: <strong>{primaryCorrect}</strong>
                    {correctAnswer.includes('|') && <span className="text-gray-500 font-normal"> (hoặc: {correctAnswer.split('|').slice(1).join(', ')})</span>}
                  </span></>
                ) : (
                  <span className="text-gray-500 italic">Chưa trả lời — Đáp án: <strong className="text-gray-900">{primaryCorrect}</strong></span>
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
function GapQuestion({ question, displayPosition, userAnswer, submitted, onTextAnswer }: {
  question: QuestionDetail; userAnswer: string; submitted: boolean;
  displayPosition: number;
  onTextAnswer: (questionId: number, text: string) => void;
}) {
  const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
  const parsed = parseGapContent(question.content);

  return (
    <div id={`question-${question.id}`} className="mb-4 bg-white p-4 rounded-lg border border-gray-200">
      <div className="text-sm text-gray-900 leading-8">
        {parsed ? (
          <>
            {parsed.before}
            <InlineGapInput
              questionId={question.id}
              userAnswer={userAnswer}
              submitted={submitted}
              correctAnswer={correctAnswer}
              onTextAnswer={onTextAnswer}
            />
            {parsed.after}
          </>
        ) : (
          <>
            <span className="font-bold mr-2">{displayPosition}.</span>
            {question.content}
            <InlineGapInput
              questionId={question.id}
              userAnswer={userAnswer}
              submitted={submitted}
              correctAnswer={correctAnswer}
              onTextAnswer={onTextAnswer}
            />
          </>
        )}
      </div>
    </div>
  );
}

/** Render groupContent paragraph with inline blanks */
function ParagraphGapFilling({ groupContent, questions, submitted, textAnswers, onTextAnswer, questionPositionById = {} }: {
  groupContent: string;
  questions: QuestionDetail[];
  submitted: boolean;
  textAnswers: Record<number, string>;
  onTextAnswer: (questionId: number, text: string) => void;
  questionPositionById?: Record<number, number>;
}) {
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

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
        <strong className="text-blue-600">{displayNum}</strong>
        <InlineGapInput questionId={question.id} userAnswer={userAnswer} submitted={submitted}
          correctAnswer={correctAnswer} onTextAnswer={onTextAnswer} />
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
        <div className="space-y-2 border-t border-gray-200 pt-3">
          {sortedQuestions.map((q) => {
            const userAnswer = textAnswers[q.id] ?? '';
            const correctAnswer = q.options.find(o => o.isCorrect)?.content ?? '';
            const correct = isAnswerCorrect(userAnswer, correctAnswer);
            const wrong = userAnswer.trim() !== '' && !correct;
            const displayPosition = questionPositionById[q.id] ?? q.position;
            const primaryCorrect = correctAnswer.split('|')[0];

            return (
              <div key={q.id} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${
                correct ? 'bg-green-50' : wrong ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <span className="font-bold text-gray-900 min-w-[20px]">{displayPosition}.</span>
                {correct ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-gray-900" /><span className="text-gray-900 font-semibold">Đúng</span></>
                ) : wrong ? (
                  <><XCircle className="h-3.5 w-3.5 text-gray-700" /><span className="text-gray-800">Đáp án: <strong>{primaryCorrect}</strong></span></>
                ) : (
                  <span className="text-gray-500 italic">Chưa trả lời — Đáp án: <strong className="text-gray-900">{primaryCorrect}</strong></span>
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
  examMode,
}: Props) {
  const sentenceQs = questions.filter(q => q.content.trim());
  const paragraphQs = questions.filter(q => !q.content.trim());

  return (
    <div className="space-y-4">
      {imageUrl && (
        <div className="rounded-lg p-3 mb-4 bg-white border border-gray-200">
          <img src={imageUrl} alt="Diagram" className="max-w-full h-auto rounded" />
        </div>
      )}

      {/* Use inline sentence gaps for exam mode or sentence questions */}
      {examMode || sentenceQs.length > 0 ? (
        <IELTSBoxedGapFilling
          questions={sentenceQs.length > 0 ? sentenceQs : questions}
          submitted={submitted}
          textAnswers={textAnswers}
          onTextAnswer={onTextAnswer}
          questionPositionById={questionPositionById}
        />
      ) : null}

      {groupContent && paragraphQs.length > 0 && (
        <ParagraphGapFilling
          groupContent={groupContent}
          questions={paragraphQs}
          submitted={submitted}
          textAnswers={textAnswers}
          onTextAnswer={onTextAnswer}
          questionPositionById={questionPositionById}
        />
      )}
    </div>
  );
}
