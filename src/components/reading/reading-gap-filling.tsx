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
  const hasAnswer = userAnswer.trim().length > 0;

  const minLength = compact ? 30 : 50;
  const charWidth = 7;
  const inputWidth = Math.max(minLength, userAnswer.length * charWidth + 16);

  return (
    <input
      type="text"
      value={userAnswer}
      disabled={submitted}
      placeholder="..."
      onChange={e => onTextAnswer(questionId, e.target.value)}
      className={`inline-block bg-transparent px-1 py-0.5 outline-none text-left align-baseline border-b-2 ${
        submitted && correct ? 'border-blue-600 text-gray-900 font-medium'
          : submitted && wrong ? 'border-red-500 text-red-700'
          : hasAnswer ? 'border-blue-600 text-gray-900 font-medium'
          : 'border-gray-300 focus:border-blue-600'
      } ${compact ? 'text-sm' : 'text-base'}`}
      style={{ width: `${inputWidth}px`, minWidth: `${minLength}px` }}
    />
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

  // Calculate input width based on content
  const minLength = 80;
  const charWidth = 8;
  const inputWidth = Math.max(minLength, userAnswer.length * charWidth + 32);
  const isBlank = userAnswer.trim().length === 0;

  return (
    <span className="relative inline-block align-middle" style={{ minWidth: `${minLength}px`, width: isBlank ? `${minLength}px` : `${inputWidth}px`, maxWidth: '400px' }}>
      <input
        type="text"
        value={userAnswer}
        disabled={submitted}
        onChange={e => onTextAnswer(questionId, e.target.value)}
        className={`w-full rounded-sm border bg-white px-2 text-center text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 transition-all ${
          submitted && correct ? 'border-blue-600 bg-blue-50'
            : submitted && wrong ? 'border-red-500 bg-red-50'
            : hasAnswer ? 'border-blue-600 bg-white'
            : 'border-gray-300 focus:border-blue-600 focus:ring-blue-200'
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

        {/* Result feedback */}
        {submitted && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded inline-block ${
              correct ? 'bg-green-50' : wrong ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              <span className="font-bold text-gray-900">{displayPosition}.</span>
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
            {question.explanation?.text && (
              <div className="mt-2">
                <p className="text-xs text-gray-600"><strong>Explanation:</strong> {question.explanation.text}</p>
                {question.explanation.evidence && (
                  <div className="space-y-1 mt-1">
                    {question.explanation.evidence.split('\n---\n').filter((e: string) => e.trim()).map((chunk: string, i: number) => (
                      <p key={i} className={`text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded ${onLocateEvidence ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                        onClick={() => onLocateEvidence?.(chunk.trim())}>
                        Evidence {i + 1}: &ldquo;{chunk.trim()}&rdquo;
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Non-exam mode: inline layout
  const compact = examMode ?? true;

  return (
    <div id={`question-${question.id}`} className={`rounded-lg bg-white p-4 ${compact ? 'shadow-sm' : ''}`}>
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
    <div className={`bg-white p-4 space-y-4 ${examMode ? 'text-[13px]' : ''}`}>
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
                  className={`rounded-lg px-3 py-2 ${
                    correct
                      ? 'bg-gray-50'
                      : wrong
                      ? 'bg-gray-50'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-900">{displayPosition}.</span>
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
                {question.explanation?.text && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600"><strong>Explanation:</strong> {question.explanation.text}</p>
                    {question.explanation.evidence && (
                      <div className="space-y-1 mt-1">
                        {question.explanation.evidence.split('\n---\n').filter((e: string) => e.trim()).map((chunk: string, ci: number) => (
                          <p key={ci} className={`text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded ${onLocateEvidence ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                            onClick={() => onLocateEvidence?.(chunk.trim())}>
                            Evidence {ci + 1}: &ldquo;{chunk.trim()}&rdquo;
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

  // For exam mode with sentence questions, use inline sentence gaps
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

