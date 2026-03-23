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
  questionOffset?: number;
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
    <div id={`question-${question.id}`} className="border border-gray-200 rounded-lg p-4">
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
function ParagraphGapFilling({ groupContent, questions, submitted, textAnswers, onTextAnswer, questionOffset = 0 }: {
  groupContent: string;
  questions: QuestionDetail[];
  submitted: boolean;
  textAnswers: Record<number, string>;
  onTextAnswer: (questionId: number, text: string) => void;
  questionOffset?: number;
}) {
  // Build a map: globalPosition → question (offset + local position)
  const posMap = new Map(questions.map(q => [questionOffset + q.position, q]));

  // Find all gap patterns:
  // "[1]___" (new click-to-gap format), "1...", "10 ……….", "2…", "11 __"
  const pattern = /\[(\d+)\]_{2,}|(\d+)\s*(?:\.{2,}|…+|_{2,})/g;
  const rendered: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of groupContent.matchAll(pattern)) {
    const num = parseInt(match[1] ?? match[2], 10);
    const question = posMap.get(num);

    // Only replace if this number maps to a question position
    if (!question) continue;

    // Add text before this match
    if (match.index! > lastIndex) {
      rendered.push(<span key={`t-${lastIndex}`}>{groupContent.slice(lastIndex, match.index!)}</span>);
    }

    const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
    const userAnswer = textAnswers[question.id] ?? '';
    rendered.push(
      <span key={`q-${num}`} className="inline-flex items-baseline gap-0.5 mx-0.5">
        <strong className="text-blue-600">{num}</strong>
        <GapInput questionId={question.id} userAnswer={userAnswer} submitted={submitted}
          correctAnswer={correctAnswer} onTextAnswer={onTextAnswer} />
      </span>
    );
    lastIndex = match.index! + match[0].length;
  }

  // Add remaining text
  if (lastIndex < groupContent.length) {
    rendered.push(<span key={`t-${lastIndex}`}>{groupContent.slice(lastIndex)}</span>);
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

export function ReadingGapFilling({ questions, groupContent, imageUrl, submitted, textAnswers, onTextAnswer, questionOffset = 0 }: Props) {
  // Sentence questions: have content (with {{answer}} or text)
  // Paragraph questions: empty content OR tagged with gapMode='paragraph'
  const sentenceQs = questions.filter(q => q.content.trim());
  const paragraphQs = questions.filter(q => !q.content.trim());

  return (
    <div className="space-y-3">
      {imageUrl && (
        <div className="border border-gray-200 rounded-lg p-3">
          <Image src={imageUrl} alt="Diagram" width={600} height={400}
            className="max-w-full h-auto rounded" unoptimized />
        </div>
      )}

      {/* Sentence questions */}
      {sentenceQs.map(question => (
        <GapQuestion
          key={question.id}
          question={question}
          userAnswer={textAnswers[question.id] ?? ''}
          submitted={submitted}
          onTextAnswer={onTextAnswer}
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
          questionOffset={questionOffset}
        />
      )}
    </div>
  );
}
