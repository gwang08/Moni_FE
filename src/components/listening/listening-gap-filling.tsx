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

/** IELTS-style boxed gap input for exam mode */
function IELTSBoxedGapInput({ questionId, userAnswer, submitted, correctAnswer, onTextAnswer, questionNumber }: {
  questionId: number; userAnswer: string; submitted: boolean; correctAnswer: string;
  onTextAnswer: (questionId: number, text: string) => void;
  questionNumber: number;
}) {
  const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
  const wrong = submitted && userAnswer.trim() !== '' && !isAnswerCorrect(userAnswer, correctAnswer);

  return (
    <div className="relative inline-block">
      <input
        type="text"
        value={userAnswer}
        disabled={submitted}
        onChange={e => onTextAnswer(questionId, e.target.value)}
        className={`text-center text-sm font-normal border rounded-sm bg-white focus:outline-none focus:ring-2 px-2 py-1 transition-all ${
          submitted && correct ? 'border-gray-900 text-gray-900 bg-gray-50 ring-0'
            : submitted && wrong ? 'border-gray-500 text-gray-700 bg-red-50 ring-0'
            : 'border-gray-400 focus:border-gray-900 focus:ring-gray-200'
        }`}
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

/** IELTS-style inline gap input for paragraph mode */
function InlineGapInput({ questionId, userAnswer, submitted, correctAnswer, onTextAnswer }: {
  questionId: number; userAnswer: string; submitted: boolean; correctAnswer: string;
  onTextAnswer: (questionId: number, text: string) => void;
}) {
  const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
  const wrong = submitted && userAnswer.trim() !== '' && !isAnswerCorrect(userAnswer, correctAnswer);

  const minLength = 40;
  const charWidth = 8;
  const inputWidth = Math.max(minLength, userAnswer.length * charWidth + 20);

  return (
    <input
      type="text"
      value={userAnswer}
      disabled={submitted}
      placeholder=""
      onChange={e => onTextAnswer(questionId, e.target.value)}
      className={`inline-block px-1 py-0.5 outline-none text-center align-baseline text-sm font-medium border-b-2 bg-transparent ${
        submitted && correct ? 'border-gray-900 text-gray-900 bg-gray-50'
          : submitted && wrong ? 'border-gray-500 text-gray-700 bg-red-50'
          : 'border-gray-400 focus:border-gray-900'
      }`}
      style={{ width: `${inputWidth}px`, minWidth: '40px' }}
    />
  );
}

/** IELTS-style boxed gap-filling questions for exam mode */
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
    <div className="bg-white p-5 border border-gray-300 rounded-lg shadow-sm">
      <div className="space-y-3">
        {sortedQuestions.map((q) => {
          const userAnswer = textAnswers[q.id] ?? '';
          const displayPosition = questionPositionById[q.id] ?? q.position;
          const correctAnswer = q.options.find(o => o.isCorrect)?.content ?? '';
          const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
          const wrong = submitted && userAnswer.trim() !== '' && !correct;

          return (
            <div key={q.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-start gap-4 flex-1">
                <span className="min-w-[20px] text-sm font-normal text-gray-900 mt-0.5">
                  {displayPosition}
                </span>
                <p className="flex-1 text-sm text-gray-800 font-normal leading-relaxed">
                  {formatContent(q.content)}
                </p>
              </div>
              <IELTSBoxedGapInput
                questionId={q.id}
                userAnswer={userAnswer}
                submitted={submitted}
                correctAnswer={correctAnswer}
                onTextAnswer={onTextAnswer}
                questionNumber={displayPosition}
              />
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
                  <><CheckCircle2 className="h-3.5 w-3.5 text-gray-900" /><span className="text-gray-900 font-semibold">Correct</span></>
                ) : wrong ? (
                  <><XCircle className="h-3.5 w-3.5 text-gray-700" /><span className="text-gray-800">Answer: <strong>{primaryCorrect}</strong>
                    {correctAnswer.includes('|') && <span className="text-gray-500 font-normal"> (or: {correctAnswer.split('|').slice(1).join(', ')})</span>}
                  </span></>
                ) : (
                  <span className="text-gray-500 italic">Not answered — Answer: <strong className="text-gray-900">{primaryCorrect}</strong></span>
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
    <div className="rounded-lg bg-white p-5 border border-gray-300 shadow-sm">
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
                  <><CheckCircle2 className="h-3.5 w-3.5 text-gray-900" /><span className="text-gray-900 font-semibold">Correct</span></>
                ) : wrong ? (
                  <><XCircle className="h-3.5 w-3.5 text-gray-700" /><span className="text-gray-800">Answer: <strong>{primaryCorrect}</strong></span></>
                ) : (
                  <span className="text-gray-500 italic">Not answered — Answer: <strong className="text-gray-900">{primaryCorrect}</strong></span>
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

      {/* Use boxed layout for exam mode or sentence questions */}
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
