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

/** IELTS-style inline gap input */
function GapInput({ questionId, userAnswer, submitted, correctAnswer, onTextAnswer }: {
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

/** Renders a single gap-fill question as inline sentence with blank */
function GapQuestion({ question, displayPosition, userAnswer, submitted, onTextAnswer }: {
  question: QuestionDetail; userAnswer: string; submitted: boolean;
  displayPosition: number;
  onTextAnswer: (questionId: number, text: string) => void;
}) {
  const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
  const parsed = parseGapContent(question.content);

  return (
    <div id={`question-${question.id}`} className="mb-4 bg-white p-4 rounded-lg">
      <div className="text-sm text-gray-900 leading-8">
        {parsed ? (
          <>
            {parsed.before}
            <GapInput
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
            <GapInput
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
        <GapInput questionId={question.id} userAnswer={userAnswer} submitted={submitted}
          correctAnswer={correctAnswer} onTextAnswer={onTextAnswer} />
      </span>
    );
    lastIndex = match.index! + match[0].length;
  });

  if (lastIndex < groupContent.length) {
    rendered.push(<span key={`t-${lastIndex}`}>{groupContent.slice(lastIndex)}</span>);
  }

  return (
    <div className="rounded-lg bg-white p-4 space-y-4">
      <div className="text-sm text-gray-900 leading-8">{rendered}</div>
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
        <div className="rounded-lg p-3 mb-4">
          <img src={imageUrl} alt="Diagram" className="max-w-full h-auto rounded" />
        </div>
      )}

      {sentenceQs.map(question => (
        <GapQuestion
          key={question.id}
          question={question}
          displayPosition={questionPositionById[question.id] ?? question.position}
          userAnswer={textAnswers[question.id] ?? ''}
          submitted={submitted}
          onTextAnswer={onTextAnswer}
        />
      ))}

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
