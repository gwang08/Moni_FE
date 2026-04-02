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
  if (!match) return null;
  return { before: match[1], answer: match[2], after: match[3] };
}

/** Inline gap input */
function GapInput({ questionId, userAnswer, submitted, correctAnswer, onTextAnswer, compact = true }: {
  questionId: number; userAnswer: string; submitted: boolean; correctAnswer: string;
  onTextAnswer: (questionId: number, text: string) => void;
  compact?: boolean;
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
      className={`inline-block bg-white px-2 py-1 outline-none text-center align-baseline ${
        submitted && correct ? 'border-gray-900 text-gray-900 font-medium'
          : submitted && wrong ? 'border-gray-500 text-gray-700'
          : 'border-gray-400 focus:border-gray-900'
      } ${compact ? 'w-[76px]' : 'w-[120px]'} border rounded-sm border-b-2 shadow-sm`}
    />
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

  const compact = examMode ?? true;

  return (
    <div id={`question-${question.id}`} className={`rounded-lg border border-gray-300 bg-white p-4 ${compact ? 'shadow-sm' : ''}`}>
      <div className={`${compact ? 'text-[13px] leading-7' : 'text-sm leading-8'} text-gray-900`}>
        <span className="mr-1 font-bold">{displayPosition}.</span>
        {parsed ? (
          <>
            {parsed.before}
            <GapInput
              questionId={question.id}
              userAnswer={userAnswer}
              submitted={submitted}
              correctAnswer={correctAnswer}
              onTextAnswer={onTextAnswer}
              compact
            />
            {parsed.after}
          </>
        ) : (
          <>
            {question.content}
            <GapInput
              questionId={question.id}
              userAnswer={userAnswer}
              submitted={submitted}
              correctAnswer={correctAnswer}
              onTextAnswer={onTextAnswer}
              compact
            />
          </>
        )}
      </div>

      {/* Result feedback */}
      {submitted && (
        <div className="mt-2 ml-5 flex items-center gap-2 text-xs">
          {correct ? (
            <><CheckCircle2 className="h-3.5 w-3.5 text-gray-900" /><span className="text-gray-900 font-semibold">Đúng</span></>
          ) : wrong ? (
            <><XCircle className="h-3.5 w-3.5 text-gray-700" /><span className="text-gray-800">Đáp án: <strong>{primaryCorrect}</strong>
              {correctAnswer.includes('|') && <span className="text-gray-500 font-normal"> (hoặc: {correctAnswer.split('|').slice(1).join(', ')})</span>}
            </span></>
          ) : (
            <span className="text-gray-500 italic">Chưa trả lời — Đáp án: <strong className="text-gray-900">{primaryCorrect}</strong>
              {correctAnswer.includes('|') && <span className="text-gray-500 font-normal"> (hoặc: {correctAnswer.split('|').slice(1).join(', ')})</span>}
            </span>
          )}
        </div>
      )}

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

/** Render groupContent paragraph with inline blanks replacing number patterns */
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
  // Sort questions by position to match gap order in content
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

  // Find all gap patterns:
  // "[1]___" (new click-to-gap format), "1...", "10 ……….", "2…", "11 __"
  const pattern = /\[(\d+)\]_{2,}|(\d+)\s*(?:\.{2,}|…+|_{2,})/g;
  const matches = [...groupContent.matchAll(pattern)];
  const rendered: React.ReactNode[] = [];
  let lastIndex = 0;

  // Map gaps by ORDER of appearance → question by sorted index
  matches.forEach((match, gapIndex) => {
    const question = sortedQuestions[gapIndex]; // match by order, not by number

    if (!question) return;

    // Add text before this match
    if (match.index! > lastIndex) {
      rendered.push(<span key={`t-${lastIndex}`}>{groupContent.slice(lastIndex, match.index!)}</span>);
    }

    // Display the global position number (from remapped question)
    const displayNum = questionPositionById[question.id] ?? question.position;
    const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
    const userAnswer = textAnswers[question.id] ?? '';
    rendered.push(
      <span key={`q-${gapIndex}`} id={`question-${question.id}`} className="inline-flex items-baseline gap-0.5 mx-0.5">
        <strong className="text-blue-600">{displayNum}</strong>
        <GapInput questionId={question.id} userAnswer={userAnswer} submitted={submitted}
          correctAnswer={correctAnswer} onTextAnswer={onTextAnswer} />
      </span>
    );
    lastIndex = match.index! + match[0].length;
  });

  // Add remaining text
  if (lastIndex < groupContent.length) {
    rendered.push(<span key={`t-${lastIndex}`}>{groupContent.slice(lastIndex)}</span>);
  }

  return (
    <div className={`rounded-lg border border-gray-300 bg-white p-4 space-y-4 shadow-sm ${examMode ? 'text-[13px]' : ''}`}>
      <div className={`text-gray-900 ${examMode ? 'leading-7' : 'text-sm leading-8'}`}>{rendered}</div>

      {/* Show results per question after submit */}
      {submitted && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {questions.map(question => {
            const correctAnswer = question.options.find(o => o.isCorrect)?.content ?? '';
            const userAnswer = textAnswers[question.id] ?? '';
            const correct = isAnswerCorrect(userAnswer, correctAnswer);
            const wrong = userAnswer.trim() !== '' && !correct;
            const displayPosition = questionPositionById[question.id] ?? question.position;
            const primaryCorrect = correctAnswer.split('|')[0];

            return (
                <div
                  key={question.id}
                  className={`rounded-lg border px-3 py-2 ${
                    correct
                      ? 'border-gray-300 bg-gray-50'
                      : wrong
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-900">{displayPosition}.</span>
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
                {question.explanation?.text && (
                  <div className="ml-5 mt-2">
                    <p className="text-xs text-gray-600"><strong>Giải thích:</strong> {question.explanation.text}</p>
                    {question.explanation.evidence && (
                      <div className="space-y-1 mt-1">
                        {question.explanation.evidence.split('\n---\n').filter((e: string) => e.trim()).map((chunk: string, ci: number) => (
                          <p key={ci} className={`text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded ${onLocateEvidence ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                            onClick={() => onLocateEvidence?.(chunk.trim())}>
                            Dẫn chứng {ci + 1}: &ldquo;{chunk.trim()}&rdquo;
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
  // Sentence questions: have content (with {{answer}} or text)
  // Paragraph questions: empty content OR tagged with gapMode='paragraph'
  const sentenceQs = questions.filter(q => q.content.trim());
  const paragraphQs = questions.filter(q => !q.content.trim());

  return (
    <div className="space-y-4">
      {imageUrl && (
        <div className="rounded-lg border border-gray-200 p-3">
          <Image src={imageUrl} alt="Diagram" width={600} height={400}
            className="max-w-full h-auto rounded" unoptimized />
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

