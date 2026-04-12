'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { EvidenceList } from '@/components/admin/evidence-list';
import type { QuestionRequest } from '@/types/admin.types';

// TipTap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import { Table as TableExtension } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { RichTextToolbar } from '@/components/admin/rich-text-toolbar';

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

const EDITOR_EXTENSIONS = [
  StarterKit,
  Placeholder.configure({ placeholder: '📝 Nhập nội dung và bấm "Thêm gap" (hoặc gõ __) để đánh dấu chỗ trống...' }),
  Underline,
  Subscript,
  Superscript,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  LinkExtension.configure({ openOnClick: false }),
  ImageExtension,
  TableExtension.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
];

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

function countPlaceholders(text: string): number {
  if (!text) return 0;
  return (text.match(/__+/g) ?? []).length;
}

function syncQuestions(existing: QuestionRequest[], count: number): QuestionRequest[] {
  return Array.from({ length: count }, (_, index) => buildGapQuestion(existing[index]));
}

function isQuestionIncomplete(question: QuestionRequest) {
  return !extractAnswer(question).trim();
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
  const gapCount = countPlaceholders(content);
  const incompleteCount = questions.filter(isQuestionIncomplete).length;

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[150px] focus:outline-none px-4 py-3 bg-white',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const nextContent = ed.getHTML();
      const currentGapCount = countPlaceholders(nextContent);
      const nextQuestions = syncQuestions(questions, currentGapCount);
      commit(nextContent, nextQuestions);
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (groupContent !== undefined && groupContent !== currentHtml) {
      editor.commands.setContent(groupContent, { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupContent]);

  useEffect(() => {
    return () => { editor?.destroy(); };
  }, [editor]);

  useEffect(() => {
    if (groupContent == null) return;
    if (questions.length === gapCount) return;
    const nextQuestions = syncQuestions(questions, gapCount);
    commit(groupContent, nextQuestions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gapCount, groupContent, questions.length]);

  const commit = (nextContent: string, nextQuestions: QuestionRequest[]) => {
    if (onBatchUpdate) {
      onBatchUpdate(nextContent, nextQuestions);
    } else {
      onGroupContentChange?.(nextContent);
      onChange(nextQuestions);
    }
  };

  const addGap = () => {
    if (!editor) return;
    editor.commands.insertContent(' __ ');
    editor.commands.focus();
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

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-30 rounded-lg border border-gray-200 bg-white/95 p-2 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">Gap Filling</span>
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
          <Button type="button" size="sm" variant="outline" className="ml-auto h-7 gap-1 border-dashed text-xs" onClick={addGap}>
            <Plus className="h-3 w-3" />
            Thêm gap
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-medium uppercase tracking-wide text-gray-400">Đề bài (Có thể dùng Editor định dạng, chổi xóa)</label>
        </div>

        <div className="rounded-md border border-input bg-white overflow-hidden shadow-sm">
          {editor && <RichTextToolbar editor={editor} />}
          <EditorContent editor={editor} />
        </div>

        {questions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mt-4">
              <label className="block text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Danh sách đáp án - (Xóa `__` trên Editor để xóa Gap tương ứng)
              </label>
            </div>
            {questions.map((question, globalQuestionIndex) => {
              const answer = extractAnswer(question);
              return (
                <div key={`gap-${globalQuestionIndex}`} className="rounded-lg border border-dashed border-gray-200 p-3 bg-white">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white">
                        {positionOffset + globalQuestionIndex + 1}
                      </span>
                      <span className="text-xs font-semibold text-blue-700">Gap</span>
                    </div>
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
    </div>
  );
}
