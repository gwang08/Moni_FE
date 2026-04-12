'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, MousePointerClick, PenLine, Undo2 } from 'lucide-react';
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
  StarterKit.configure({
    bulletList: { HTMLAttributes: { class: 'list-disc pl-6 space-y-1 my-2' } },
    orderedList: { HTMLAttributes: { class: 'list-decimal pl-6 space-y-1 my-2' } },
  }),
  Placeholder.configure({ placeholder: '📝 Nhập nội dung đề bài. Chuyển sang mode "Đánh dấu gap" để bôi chọn tạo gap...' }),
  Underline,
  Subscript,
  Superscript,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph', 'listItem'] }),
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

/** Render groupContent HTML replacing __ with a numbered gap pill for the select-mode preview */
function renderPreviewHtml(html: string, answers: string[]): string {
  let gapIndex = 0;
  return html.replace(/__+/g, () => {
    const num = gapIndex + 1;
    const answer = answers[gapIndex]?.trim() ?? '';
    gapIndex += 1;
    if (answer) {
      return `<span style="display:inline-flex;align-items:baseline;gap:2px;margin:0 2px"><strong style="color:#2563eb;font-size:13px">${num}</strong><span style="display:inline-block;min-width:70px;border-bottom:2px solid #9ca3af;text-align:center;color:#16a34a;font-size:12px;padding:0 4px;font-weight:600">${answer}</span></span>`;
    }
    return `<span style="display:inline-flex;align-items:baseline;gap:2px;margin:0 2px"><strong style="color:#2563eb;font-size:13px">${num}</strong><span style="display:inline-block;min-width:70px;border-bottom:2px solid #9ca3af;text-align:center;color:#9ca3af;font-size:12px;padding:0 4px">___</span></span>`;
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
  const gapCount = countPlaceholders(content);
  const incompleteCount = questions.filter(isQuestionIncomplete).length;

  // 'edit' = TipTap editor, 'select' = bôi chọn tạo gap trên preview
  const [mode, setMode] = useState<'edit' | 'select'>('edit');
  const passageRef = useRef<HTMLDivElement>(null);

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

  /** Insert __ at current editor cursor position */
  const addGapAtCursor = () => {
    if (!editor) return;
    editor.commands.insertContent(' __ ');
    editor.commands.focus();
  };

  /** Select-to-gap mode: bôi chọn từ trên preview → bấm Tạo gap */
  const handleCreateGapFromSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !passageRef.current) return;
    const selectedText = sel.toString().trim();
    if (!selectedText || !passageRef.current.contains(sel.anchorNode!)) return;

    const currentHtml = editor?.getHTML() ?? content;
    const htmlIdx = currentHtml.indexOf(selectedText);
    if (htmlIdx !== -1) {
      const newHtml = currentHtml.slice(0, htmlIdx) + ' __ ' + currentHtml.slice(htmlIdx + selectedText.length);
      editor?.commands.setContent(newHtml, { emitUpdate: true });
    }

    sel.removeAllRanges();
  }, [content, editor]);

  /** Undo last gap: remove last __ token from editor HTML */
  const handleUndoLastGap = useCallback(() => {
    if (!editor || gapCount === 0) return;
    const currentHtml = editor.getHTML();
    const lastIdx = currentHtml.lastIndexOf('__');
    if (lastIdx === -1) return;
    const newHtml = currentHtml.slice(0, lastIdx) + currentHtml.slice(lastIdx + 2);
    editor.commands.setContent(newHtml, { emitUpdate: true });
  }, [editor, gapCount]);

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

  const answers = questions.map((q) => extractAnswer(q));

  return (
    <div className="space-y-3">
      {/* ── Header bar ── */}
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
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

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              type="button" size="sm"
              variant={mode === 'edit' ? 'default' : 'outline'}
              className={`h-7 gap-1 text-xs ${mode === 'edit' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              onClick={() => setMode('edit')}
            >
              <PenLine className="h-3 w-3" />
              Soạn thảo
            </Button>
            <Button
              type="button" size="sm"
              variant={mode === 'select' ? 'default' : 'outline'}
              className={`h-7 gap-1 text-xs ${mode === 'select' ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
              onClick={() => setMode('select')}
            >
              <MousePointerClick className="h-3 w-3" />
              Đánh dấu gap
            </Button>
          </div>
        </div>

        {mode === 'edit' && (
          <p className="mt-1.5 text-[10px] text-gray-400">
            Gõ nội dung đề bài rồi bấm <strong>Đánh dấu gap</strong> để bôi chọn từ cần làm trống.
            Hoặc gõ thẳng <code className="bg-gray-100 px-1 rounded">__</code> vào vị trí cần gap.
          </p>
        )}
        {mode === 'select' && (
          <p className="mt-1.5 text-[10px] text-violet-600 font-medium">
            Bôi chọn từ / cụm từ trong đoạn văn bên dưới → bấm &ldquo;Tạo gap từ selection&rdquo; để tạo lỗ hổng.
          </p>
        )}
      </div>

      {/* ── EDIT MODE: full TipTap WYSIWYG ── */}
      {mode === 'edit' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-medium uppercase tracking-wide text-gray-400">Đề bài</label>
            <Button type="button" size="sm" variant="outline" className="h-7 gap-1 border-dashed text-xs" onClick={addGapAtCursor}>
              <Plus className="h-3 w-3" />
              Thêm gap tại cursor
            </Button>
          </div>
          <div className="rounded-md border border-input bg-white overflow-hidden shadow-sm">
            {editor && <RichTextToolbar editor={editor} />}
            <EditorContent editor={editor} />
          </div>
        </div>
      )}

      {/* ── SELECT MODE: preview with bôi-chọn → Tạo gap ── */}
      {mode === 'select' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Đoạn đề bài — Bôi chọn để tạo gap
            </label>
            {gapCount > 0 && (
              <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-xs text-gray-400" onClick={handleUndoLastGap}>
                <Undo2 className="h-3 w-3" />
                Hoàn tác gap cuối
              </Button>
            )}
          </div>
          <div className="relative pb-4">
            <div
              ref={passageRef}
              className="rounded-lg border border-violet-200 bg-violet-50/30 px-4 py-3 text-sm leading-7 select-text cursor-text"
              dangerouslySetInnerHTML={{ __html: renderPreviewHtml(content, answers) }}
            />
            <div className="absolute bottom-0 right-2">
              <Button
                type="button" size="sm"
                className="h-7 gap-1 bg-violet-600 hover:bg-violet-700 text-xs shadow-lg"
                onMouseDown={(e) => { e.preventDefault(); handleCreateGapFromSelection(); }}
              >
                <MousePointerClick className="h-3 w-3" />
                Tạo gap từ selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Answers list ── */}
      {questions.length > 0 && (
        <div className="space-y-3 pt-2">
          <label className="block text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Danh sách đáp án — Xóa <code className="bg-gray-100 px-1 rounded normal-case">__</code> trong soạn thảo để xóa gap tương ứng
          </label>
          {questions.map((question, globalQuestionIndex) => {
            const answer = extractAnswer(question);
            return (
              <div key={`gap-${globalQuestionIndex}`} className="rounded-lg border border-dashed border-gray-200 p-3 bg-white">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white">
                    {positionOffset + globalQuestionIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-blue-700">Gap</span>
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
  );
}