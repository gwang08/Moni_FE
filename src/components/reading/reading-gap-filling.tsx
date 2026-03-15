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
            <><XCircle className="h-3.5 w-3.5 text-red-500" /><span className="text-red-600">Đáp án: <strong>{correctAnswer.split('|')[0]}</strong>
              {correctAnswer.includes('|') && <span className="text-gray-400 font-normal"> (hoặc: {correctAnswer.split('|').slice(1).join(', ')})</span>}
            </span></>
          ) : (
            <span className="text-gray-400 italic">Chưa trả lời — Đáp án: <strong className="text-green-700">{correctAnswer.split('|')[0]}</strong>
              {correctAnswer.includes('|') && <span className="text-gray-400 font-normal"> (hoặc: {correctAnswer.split('|').slice(1).join(', ')})</span>}
            </span>
          )}
        </div>
      )}

      {submitted && question.explanation?.text && (
        <div className="mt-2 ml-5 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500"><strong>Giải thích:</strong> {question.explanation.text}</p>
          {question.explanation.evidence && (
            <div className="space-y-1 mt-1">
              {question.explanation.evidence.split('\n---\n').filter((e: string) => e.trim()).map((chunk: string, i: number) => (
                <p key={i} className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                  Dẫn chứng: &ldquo;{chunk.trim()}&rdquo;
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Render groupContent paragraph with inline blanks replacing number patterns */
function ParagraphGapFilling({ groupContent, questions, submitted, textAnswers, onTextAnswer }: {
  groupContent: string;
  questions: QuestionDetail[];
  submitted: boolean;
  textAnswers: Record<number, string>;
  onTextAnswer: (questionId: number, text: string) => void;
}) {
  // Build a map: position → question
  const posMap = new Map(questions.map(q => [q.position, q]));

  // Split groupContent by number patterns like "10 ………." or "10..." or "10 __"
  // Match: number + optional space + (dots/underscores/ellipsis)
  const parts = groupContent.split(/(\b(\d+)\s*(?:\.{2,}|…+|_{2,}))/g);

  const rendered: React.ReactNode[] = [];
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    // Check if this is a matched group (full match is at i, captured number at i+1)
    if (i + 2 < parts.length && parts[i] === parts[i] && /^\d+\s*(?:\.{2,}|…+|_{2,})$/.test(parts[i])) {
      const num = parseInt(parts[i + 1], 10);
      const question = posMap.get(num);
      if (question) {
        const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
        const userAnswer = textAnswers[question.id] ?? '';
        rendered.push(
          <span key={`q-${num}`} className="inline-flex items-baseline gap-0.5">
            <strong className="text-blue-600">{num}</strong>
            <GapInput questionId={question.id} userAnswer={userAnswer} submitted={submitted}
              correctAnswer={correctAnswer} onTextAnswer={onTextAnswer} />
          </span>
        );
        i += 3; // skip full match + captured group + extra
        continue;
      }
    }
    // Regular text
    if (part) rendered.push(<span key={`t-${i}`}>{part}</span>);
    i++;
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="text-sm text-gray-800 leading-8">{rendered}</div>

      {/* Show results per question after submit */}
      {submitted && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {questions.map(question => {
            const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
            const userAnswer = textAnswers[question.id] ?? '';
            const correct = isAnswerCorrect(userAnswer, correctAnswer);
            const wrong = userAnswer.trim() !== '' && !correct;

            return (
              <div key={question.id}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-blue-600">{question.position}.</span>
                  {correct ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /><span className="text-green-600 font-medium">Đúng</span></>
                  ) : wrong ? (
                    <><XCircle className="h-3.5 w-3.5 text-red-500" /><span className="text-red-600">Đáp án: <strong>{correctAnswer.split('|')[0]}</strong>
                      {correctAnswer.includes('|') && <span className="text-gray-400 font-normal"> (hoặc: {correctAnswer.split('|').slice(1).join(', ')})</span>}
                    </span></>
                  ) : (
                    <span className="text-gray-400 italic">Chưa trả lời — Đáp án: <strong className="text-green-700">{correctAnswer.split('|')[0]}</strong></span>
                  )}
                </div>
                {question.explanation?.text && (
                  <div className="ml-5 mt-1">
                    <p className="text-xs text-gray-500"><strong>Giải thích:</strong> {question.explanation.text}</p>
                    {question.explanation.evidence && (
                      <div className="space-y-1 mt-1">
                        {question.explanation.evidence.split('\n---\n').filter((e: string) => e.trim()).map((chunk: string, ci: number) => (
                          <p key={ci} className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                            Dẫn chứng: &ldquo;{chunk.trim()}&rdquo;
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

export function ReadingGapFilling({ questions, groupContent, imageUrl, submitted, textAnswers, onTextAnswer }: Props) {
  return (
    <div className="space-y-3">
      {imageUrl && (
        <div className="border border-gray-200 rounded-lg p-3">
          <Image src={imageUrl} alt="Diagram" width={600} height={400}
            className="max-w-full h-auto rounded" unoptimized />
        </div>
      )}

      {groupContent ? (
        <ParagraphGapFilling
          groupContent={groupContent}
          questions={questions}
          submitted={submitted}
          textAnswers={textAnswers}
          onTextAnswer={onTextAnswer}
        />
      ) : (
        questions.map(question => (
          <GapQuestion
            key={question.id}
            question={question}
            userAnswer={textAnswers[question.id] ?? ''}
            submitted={submitted}
            onTextAnswer={onTextAnswer}
          />
        ))
      )}
    </div>
  );
}
