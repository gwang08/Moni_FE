'use client';

import Image from 'next/image';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { QuestionDetail } from '@/types/test.types';

interface Props {
  questions: QuestionDetail[];
  groupContent?: string;
  imageUrl?: string;
  submitted: boolean;
  textAnswers: Record<number, string>;
  onTextAnswer: (questionId: number, text: string) => void;
}

function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
}

/** Parse question content with {{answer}} marker into parts */
function parseGapContent(content: string): { before: string; answer: string; after: string } | null {
  const match = content.match(/^([\s\S]*?)\{\{(.+?)\}\}([\s\S]*)$/);
  if (!match) return null;
  return { before: match[1], answer: match[2], after: match[3] };
}

/** Inline gap input */
function GapInput({ questionId, userAnswer, submitted, correctAnswer, onTextAnswer }: {
  questionId: number; userAnswer: string; submitted: boolean; correctAnswer: string;
  onTextAnswer: (questionId: number, text: string) => void;
}) {
  const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
  const wrong = submitted && userAnswer.trim() !== '' && !isAnswerCorrect(userAnswer, correctAnswer);

  return (
    <input
      type="text"
      value={userAnswer}
      disabled={submitted}
      placeholder="..."
      onChange={e => onTextAnswer(questionId, e.target.value)}
      className={`inline-block border-b-2 bg-transparent text-sm px-1 py-0.5 outline-none w-[140px] text-center mx-1 ${
        submitted && correct ? 'border-green-500 text-green-700 font-medium'
          : submitted && wrong ? 'border-red-400 text-red-600'
          : 'border-gray-400 focus:border-blue-500'
      }`}
    />
  );
}

/** Renders a single gap-fill question as inline sentence with blank */
function GapQuestion({ question, userAnswer, submitted, onTextAnswer }: {
  question: QuestionDetail; userAnswer: string; submitted: boolean;
  onTextAnswer: (questionId: number, text: string) => void;
}) {
  const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
  const parsed = parseGapContent(question.content);
  const correct = submitted && isAnswerCorrect(userAnswer, correctAnswer);
  const wrong = submitted && userAnswer.trim() !== '' && !correct;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-sm text-gray-800 leading-8">
        <span className="text-blue-600 font-bold mr-1">{question.position}.</span>
        {parsed ? (
          <>
            {parsed.before}
            <GapInput questionId={question.id} userAnswer={userAnswer} submitted={submitted}
              correctAnswer={correctAnswer} onTextAnswer={onTextAnswer} />
            {parsed.after}
          </>
        ) : (
          <>
            {question.content}
            <GapInput questionId={question.id} userAnswer={userAnswer} submitted={submitted}
              correctAnswer={correctAnswer} onTextAnswer={onTextAnswer} />
          </>
        )}
      </div>

      {/* Result feedback */}
      {submitted && (
        <div className="mt-2 ml-5 flex items-center gap-2 text-xs">
          {correct ? (
            <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /><span className="text-green-600 font-medium">Đúng</span></>
          ) : wrong ? (
            <><XCircle className="h-3.5 w-3.5 text-red-500" /><span className="text-red-600">Đáp án: <strong>{correctAnswer}</strong></span></>
          ) : (
            <span className="text-gray-400 italic">Chưa trả lời — Đáp án: <strong className="text-green-700">{correctAnswer}</strong></span>
          )}
        </div>
      )}

      {submitted && question.explanation?.text && (
        <div className="mt-2 ml-5 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500"><strong>Giải thích:</strong> {question.explanation.text}</p>
          {question.explanation.evidence && (
            <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1">
              Dẫn chứng: &ldquo;{question.explanation.evidence}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ReadingGapFilling({ questions, imageUrl, submitted, textAnswers, onTextAnswer }: Props) {
  return (
    <div className="space-y-3">
      {imageUrl && (
        <div className="border border-gray-200 rounded-lg p-3">
          <Image src={imageUrl} alt="Diagram" width={600} height={400}
            className="max-w-full h-auto rounded" unoptimized />
        </div>
      )}

      {questions.map(question => (
        <GapQuestion
          key={question.id}
          question={question}
          userAnswer={textAnswers[question.id] ?? ''}
          submitted={submitted}
          onTextAnswer={onTextAnswer}
        />
      ))}
    </div>
  );
}
