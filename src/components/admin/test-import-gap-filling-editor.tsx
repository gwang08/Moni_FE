'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PenLine, Trash2, Plus } from 'lucide-react';
import { EvidenceList } from '@/components/admin/evidence-list';
import { formatReadingPassage } from '@/lib/format-reading-passage';
import type { QuestionRequest } from '@/types/admin.types';

interface Props {
  questions: QuestionRequest[];
  positionOffset: number;
  groupContent?: string;
  pendingEvidence: string | null;
  onAssignEvidence: (qi: number) => void;
  onGroupContentChange?: (content: string) => void;
  onChange: (questions: QuestionRequest[]) => void;
  onBatchUpdate?: (groupContent: string, questions: QuestionRequest[]) => void;
}

function extractAnswer(question: QuestionRequest): string {
  const option = question.options.find((o) => o.isCorrect);
  return option?.content ?? '';
}

function MultiAnswerInput({ answer, onChange }: { answer: string; onChange: (value: string) => void }) {
  const [answers, setAnswers] = useState(() => (answer ? answer.split('|').map((item) => item.trim()) : ['']));

  useEffect(() => {
    const parsed = answer ? answer.split('|').map((item) => item.trim()) : [''];
    const current = answers.filter((item) => item.trim()).join('|');
    if (current !== answer) setAnswers(parsed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer]);

  const commit = (nextAnswers: string[]) => {
    setAnswers(nextAnswers);
    onChange(nextAnswers.filter((item) => item.trim()).join('|'));
  };

  return (
    <div className="space-y-1">
      {answers.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...answers];
              next[index] = e.target.value;
              commit(next);
            }}
            placeholder={index === 0 ? 'Đáp án đúng' : 'Đáp án thay thế'}
            className="h-7 flex-1 text-sm"
          />
          {answers.length > 1 && (
            <button
              type="button"
              onClick={() => commit(answers.filter((_, j) => j !== index))}
              className="p-0.5 text-gray-300 hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => setAnswers([...answers, ''])} className="flex items-center gap-0.5 text-[10px] text-primary hover:underline">
        <Plus className="h-2.5 w-2.5" />
        Thêm đáp án
      </button>
    </div>
  );
}

function buildGapQuestion(existing?: QuestionRequest): QuestionRequest {
  return (
    existing ?? {
      content: '',
      options: [{ label: '', content: '', isCorrect: true }],
      metadata: { gapMode: 'paragraph' },
    }
  );
}

function splitParagraphs(text: string): string[] {
  if (!text) return [''];
  return text.split(/\n\s*\n/g);
}

function joinParagraphs(paragraphs: string[]): string {
  return paragraphs.join('\n\n');
}

function countPlaceholders(text: string): number {
  return (text.match(/__+/g) ?? []).length;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

function buildParagraphQuestionGroups(paragraphs: string[], questions: QuestionRequest[]) {
  let questionIndex = 0;

  return paragraphs.map((paragraph) => {
    const placeholderCount = countPlaceholders(paragraph);
    const gaps = Array.from({ length: placeholderCount }, (_, localIndex) => {
      const currentIndex = questionIndex;
      questionIndex += 1;

      return {
        localIndex,
        questionIndex: currentIndex,
        question: buildGapQuestion(questions[currentIndex]),
      };
    });

    return { paragraph, gaps };
  });
}

function syncQuestions(existing: QuestionRequest[], count: number): QuestionRequest[] {
  return Array.from({ length: count }, (_, index) => buildGapQuestion(existing[index]));
}

function replaceNthPlaceholder(text: string, targetIndex: number, replacement: string) {
  let seen = 0;
  return text.replace(/__+/g, (match) => {
    if (seen === targetIndex) {
      seen += 1;
      return replacement;
    }
    seen += 1;
    return match;
  });
}

function removeNthPlaceholder(text: string, targetIndex: number) {
  return replaceNthPlaceholder(text, targetIndex, '').replace(/\s{2,}/g, ' ').trim();
}

function appendGap(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return '__';
  return `${trimmed} __`;
}

function isQuestionIncomplete(question: QuestionRequest) {
  return !extractAnswer(question).trim();
}

function renderParagraphPreview(paragraph: string, startIndex: number, answers: string[]) {
  let gapOffset = 0;
  return formatReadingPassage(paragraph).replace(/__+/g, () => {
    const number = startIndex + gapOffset + 1;
    const rawAnswer = answers[gapOffset]?.trim() ?? '';
    const displayAnswer = rawAnswer ? rawAnswer.split('|').map((item) => item.trim()).filter(Boolean).join(' / ') : '';
    gapOffset += 1;
    if (displayAnswer) {
      return `<span class="mx-1 inline-flex max-w-full items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">${escapeHtml(displayAnswer)}</span>`;
    }
    return `<span class="mx-1 inline-flex min-w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">${number}</span>`;
  });
}

export function GapFillingEditor({
  questions,
  positionOffset,
  groupContent,
  pendingEvidence,
  onAssignEvidence,
  onGroupContentChange,
  onChange,
  onBatchUpdate,
}: Props) {
  const content = groupContent ?? '';
  const paragraphs = splitParagraphs(content);
  const gapCount = countPlaceholders(content);
  const incompleteCount = questions.filter(isQuestionIncomplete).length;
  const paragraphGroups = buildParagraphQuestionGroups(paragraphs, questions);
  const [editingParagraphs, setEditingParagraphs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (groupContent == null) return;
    if (questions.length === gapCount) return;
    const nextQuestions = syncQuestions(questions, gapCount);
    if (onBatchUpdate) {
      onBatchUpdate(groupContent, nextQuestions);
    } else {
      onChange(nextQuestions);
    }
  }, [gapCount, groupContent, onBatchUpdate, onChange, questions]);

  const commit = (nextContent: string, nextQuestions: QuestionRequest[]) => {
    if (onBatchUpdate) {
      onBatchUpdate(nextContent, nextQuestions);
    } else {
      onGroupContentChange?.(nextContent);
      onChange(nextQuestions);
    }
  };

  const updateParagraph = (paragraphIndex: number, value: string) => {
    const nextParagraphs = paragraphs.map((paragraph, index) => (index === paragraphIndex ? value : paragraph));
    const nextContent = joinParagraphs(nextParagraphs);
    const nextQuestions = syncQuestions(questions, countPlaceholders(nextContent));
    commit(nextContent, nextQuestions);
  };

  const addParagraph = () => {
    const nextParagraphs = [...paragraphs, ''];
    const nextContent = joinParagraphs(nextParagraphs);
    const nextQuestions = syncQuestions(questions, countPlaceholders(nextContent));
    commit(nextContent, nextQuestions);
  };

  const addGap = () => {
    const nextParagraphs = [...paragraphs];
    nextParagraphs[nextParagraphs.length - 1] = appendGap(nextParagraphs[nextParagraphs.length - 1]);
    const nextContent = joinParagraphs(nextParagraphs);
    const nextQuestions = syncQuestions(questions, countPlaceholders(nextContent));
    commit(nextContent, nextQuestions);
  };

  const removeParagraph = (paragraphIndex: number) => {
    const nextParagraphs = paragraphs.filter((_, index) => index !== paragraphIndex);
    const nextContent = joinParagraphs(nextParagraphs);
    const nextQuestions = syncQuestions(questions, countPlaceholders(nextContent));
    commit(nextContent, nextQuestions);
  };

  const toggleParagraphEdit = (paragraphIndex: number) => {
    setEditingParagraphs((current) => ({
      ...current,
      [paragraphIndex]: !current[paragraphIndex],
    }));
  };

  const updateAnswer = (questionIndex: number, answer: string) => {
    const next = questions.map((question, index) =>
      index === questionIndex ? { ...question, options: [{ label: '', content: answer, isCorrect: true }] } : question
    );
    onChange(next);
  };

  const updateExplanation = (questionIndex: number, text: string) => {
    const next = questions.map((question, index) =>
      index === questionIndex ? { ...question, explanation: { ...question.explanation, text: text || undefined } } : question
    );
    onChange(next);
  };

  const updateEvidence = (questionIndex: number, evidence: string | undefined) => {
    const next = questions.map((question, index) =>
      index === questionIndex ? { ...question, explanation: { ...question.explanation, evidence } } : question
    );
    onChange(next);
  };

  const removeGap = (questionIndex: number) => {
    const nextContent = removeNthPlaceholder(content, questionIndex);
    const nextQuestions = questions.filter((_, index) => index !== questionIndex);
    commit(nextContent, nextQuestions);
  };

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-30 rounded-lg border border-gray-200 bg-white/95 p-2 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">Gap Filling</span>
          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            {paragraphs.length} đoạn
          </span>
          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            {questions.length} gap
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              incompleteCount > 0 ? 'border border-red-200 bg-red-50 text-red-600' : 'border border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {incompleteCount > 0 ? `${incompleteCount} thiếu` : 'Đã xong'}
          </span>
          <Button type="button" size="sm" variant="outline" className="ml-auto h-7 gap-1 border-dashed text-xs" onClick={addParagraph}>
            <Plus className="h-3 w-3" />
            Thêm đoạn
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 gap-1 border-dashed text-xs" onClick={addGap}>
            <Plus className="h-3 w-3" />
            Thêm gap
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-medium uppercase tracking-wide text-gray-400">Đoạn văn</label>
          <span className="text-[10px] text-gray-400">{paragraphs.length} đoạn</span>
        </div>

        <div className="space-y-3">
          {paragraphGroups.map((group, index) => (
            <div key={`paragraph-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-700">Đoạn {index + 1}</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-xs text-gray-600 hover:text-gray-900"
                    onClick={() => toggleParagraphEdit(index)}
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    {editingParagraphs[index] ? 'Xem' : 'Sửa'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => removeParagraph(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {editingParagraphs[index] && (
                <textarea
                  value={group.paragraph}
                  onChange={(e) => updateParagraph(index, e.target.value)}
                  placeholder="Nhập đoạn văn và dùng __ để đánh dấu gap."
                  rows={5}
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              )}
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div
                  className="prose prose-sm max-w-none text-sm leading-7"
                  dangerouslySetInnerHTML={{
                    __html: renderParagraphPreview(
                      group.paragraph,
                      paragraphGroups.slice(0, index).reduce((sum, item) => sum + item.gaps.length, 0),
                      group.gaps.map(({ question }) => extractAnswer(question))
                    ),
                  }}
                />
              </div>
              {group.gaps.length > 0 && (
                <div className="mt-3 space-y-2">
                  {group.gaps.map(({ question, questionIndex: globalQuestionIndex }) => {
                    const answer = extractAnswer(question);
                    return (
                      <div key={`paragraph-gap-${globalQuestionIndex}`} className="rounded-lg border border-dashed border-gray-200 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-2">
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white">
                              {positionOffset + globalQuestionIndex + 1}
                            </span>
                            <span className="text-xs font-semibold text-blue-700">Gap</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                            onClick={() => removeGap(globalQuestionIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <MultiAnswerInput answer={answer} onChange={(value) => updateAnswer(globalQuestionIndex, value)} />
                          <textarea
                            value={question.explanation?.text ?? ''}
                            onChange={(e) => updateExplanation(globalQuestionIndex, e.target.value)}
                            placeholder="Giải thích đáp án..."
                            rows={2}
                            className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <EvidenceList
                            evidence={question.explanation?.evidence}
                            pendingEvidence={pendingEvidence}
                            onAssign={() => onAssignEvidence(globalQuestionIndex)}
                            onChange={(evidence) => updateEvidence(globalQuestionIndex, evidence)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
