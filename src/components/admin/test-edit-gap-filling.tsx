'use client';

import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ChevronDown, ChevronUp, MousePointerClick, Undo2, Plus, Trash2, PenLine, Wand2 } from 'lucide-react';
import { EvidenceList } from '@/components/admin/evidence-list';
import { GapSentenceInput, extractAnswer } from '@/components/admin/gap-sentence-input';
import { batchUpdateQuestions, updateQuestionGroupContent } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { QuestionDetail } from '@/types/test.types';

export interface TestEditGapFillingHandle {
  save: () => Promise<boolean>;
}

// TipTap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import LinkExtension from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import { Table as TableExtension } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { RichTextToolbar } from '@/components/admin/rich-text-toolbar';

interface Props {
  questions: QuestionDetail[];
  groupId: number;
  groupContent?: string;
  testId: string;
  pendingEvidence: string | null;
  onAssignEvidence: () => void;
  onEvidenceChange: (questionId: number, evidence: string) => void;
}

const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    bulletList: { HTMLAttributes: { class: 'list-disc pl-6 space-y-1 my-2' } },
    orderedList: { HTMLAttributes: { class: 'list-decimal pl-6 space-y-1 my-2' } },
  }),
  Placeholder.configure({ placeholder: 'Nhập nội dung đoạn văn...' }),
  Underline,
  Subscript,
  Superscript,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph', 'listItem'] }),
  LinkExtension.configure({ openOnClick: false }),
  TableExtension.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
];

/** Strip Google Docs / Word table wrappers from pasted HTML */
function cleanHtml(html: string): string {
  const tdContents: string[] = [];
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let match;
  while ((match = tdRegex.exec(html)) !== null) {
    const inner = match[1].trim();
    if (inner && inner !== '<p></p>' && inner !== '<p><br></p>') {
      tdContents.push(inner);
    }
  }
  return tdContents.length > 0 ? tdContents.join('') : html;
}

/** Sentence questions have content with text; paragraph questions have empty content */
const isSentenceQ = (q: { content: string }) => q.content.trim().length > 0;

function MultiAnswerInput({ answer, onChange }: { answer: string; onChange: (v: string) => void }) {
  const [answers, setAnswers] = useState(() => answer ? answer.split('|').map(a => a.trim()) : ['']);

  useEffect(() => {
    const parsed = answer ? answer.split('|').map(a => a.trim()) : [''];
    const currentFiltered = answers.filter(a => a.trim()).join('|');
    if (currentFiltered !== answer) setAnswers(parsed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer]);

  const commit = (arr: string[]) => {
    setAnswers(arr);
    onChange(arr.filter(a => a.trim()).join('|'));
  };

  return (
    <div className="space-y-1">
      {answers.map((a, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input value={a} onChange={e => { const u = [...answers]; u[i] = e.target.value; commit(u); }}
            placeholder={i === 0 ? 'Đáp án chính' : 'Đáp án thay thế'} className="text-sm h-7 flex-1" />
          {answers.length > 1 && (
            <button type="button" onClick={() => commit(answers.filter((_, j) => j !== i))}
              className="text-gray-300 hover:text-red-500 p-0.5"><Trash2 className="h-3 w-3" /></button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => setAnswers([...answers, ''])}
        className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
        <Plus className="h-2.5 w-2.5" /> Thêm đáp án
      </button>
    </div>
  );
}

/** Render HTML replacing [N]___ or ___ markers with styled gap pills resembling exam input */
function renderPassageHtml(text: string, items: { answer: string; position: number }[]): string {
  let counter = 0;
  return text.replace(/\[(\d+)\]_{2,}|_{2,}/g, (match, numMatch) => {
    const rIdx = numMatch ? parseInt(numMatch, 10) - 1 : counter;
    const item = items[rIdx];
    const displayNumber = item ? item.position : (numMatch ? parseInt(numMatch, 10) : counter + 1);
    counter++;
    const answer = item?.answer ?? '';
    const isBlank = !answer;
    
    // Renders a box like in the exam (white box, border, centered number if empty)
    return `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:60px;height:24px;border:1px solid #d1d5db;border-radius:2px;background:#fff;margin:0 4px;font-size:13px;font-weight:600;color:#111827;box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);padding:0 8px;vertical-align:middle;">${isBlank ? displayNumber : answer}</span>`;
  });
}

export const TestEditGapFilling = forwardRef<TestEditGapFillingHandle, Props>(function TestEditGapFilling(
  {
    questions, groupId, groupContent: initialGroupContent, testId,
    pendingEvidence, onAssignEvidence, onEvidenceChange,
  }: Props,
  ref
) {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  // 'edit' = TipTap editor, 'select' = bôi chọn tạo gap
  const [passageMode, setPassageMode] = useState<'edit' | 'select'>('edit');
  const passageRef = useRef<HTMLDivElement>(null);

  const [groupContentValue, setGroupContentValue] = useState(initialGroupContent ?? '');

  const [items, setItems] = useState(() =>
    questions.map(q => {
      const correct = q.options.find(o => o.isCorrect);
      return { id: q.id, position: q.position, content: q.content, answer: correct?.content ?? '' };
    })
  );

  const [explanations, setExplanations] = useState<Record<number, { text?: string; evidence?: string }>>(() => {
    const map: Record<number, { text?: string; evidence?: string }> = {};
    questions.forEach((q, i) => { if (q.explanation) map[i] = { ...q.explanation }; });
    return map;
  });

  const paragraphItems = items.filter(it => !isSentenceQ(it));
  const realIndex = (item: typeof items[0]) => items.indexOf(item);

  // ── TipTap editor for the passage ──
  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: groupContentValue,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[120px] focus:outline-none px-4 py-3 bg-white',
      },
      transformPastedHTML: (html) => cleanHtml(html),
    },
    onUpdate: ({ editor: ed }) => {
      setGroupContentValue(ed.getHTML());
    },
  });

  // Sync when groupContentValue changes externally (e.g. after select-mode gap creation)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (groupContentValue !== currentHtml) {
      editor.commands.setContent(groupContentValue, { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupContentValue]);

  useEffect(() => {
    return () => { editor?.destroy(); };
  }, [editor]);

  const handleCleanContent = useCallback(() => {
    if (!editor) return;
    const cleaned = cleanHtml(editor.getHTML());
    if (cleaned !== editor.getHTML()) {
      editor.commands.setContent(cleaned, { emitUpdate: true });
    }
  }, [editor]);

  const toggleCollapsed = (idx: number) => {
    setCollapsed(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  };

  const handleEvidenceChange = (idx: number, ev: string | undefined) => {
    setExplanations(e => ({ ...e, [idx]: { ...e[idx], evidence: ev } }));
    if (questions[idx]) onEvidenceChange(questions[idx].id, ev ?? '');
  };

  // ── Select-to-gap (same logic as before, works on the preview div) ──
  const handleCreateGap = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !passageRef.current) return;
    const selectedText = sel.toString().trim();
    if (!selectedText || !passageRef.current.contains(sel.anchorNode!)) return;

    const currentText = groupContentValue;
    const nextNum = items.length + 1;

    const range = sel.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(passageRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;

    let idx = currentText.indexOf(selectedText, Math.max(0, startOffset - 15));
    if (idx === -1) idx = currentText.indexOf(selectedText);
    if (idx === -1) { sel.removeAllRanges(); return; }

    const newContent = currentText.slice(0, idx) + `[${nextNum}]___` + currentText.slice(idx + selectedText.length);
    setGroupContentValue(newContent);
    setItems(prev => [...prev, { id: -(Date.now()), position: prev.length + 1, content: '', answer: selectedText }]);
    sel.removeAllRanges();
  }, [groupContentValue, items.length]);

  const handleUndoLastGap = useCallback(() => {
    if (paragraphItems.length === 0) return;
    const lastItem = paragraphItems[paragraphItems.length - 1];
    const rIdx = realIndex(lastItem);
    const marker = `[${rIdx + 1}]___`;
    setGroupContentValue(prev => prev.replace(marker, lastItem.answer));
    setItems(prev => prev.filter((_, i) => i !== rIdx));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paragraphItems, items]);

  // ── Save ──
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if (groupContentValue !== (initialGroupContent ?? '')) {
        await updateQuestionGroupContent(groupId, groupContentValue);
      }
      const updates: Record<string, { content: string; options: { label: string; content: string; isCorrect: boolean }[]; explanation?: { text?: string; evidence?: string } }> = {};
      items.forEach((item, i) => {
        if (item.id < 0) return;
        updates[String(item.id)] = {
          content: item.content,
          options: [{ label: '', content: item.answer, isCorrect: true }],
          explanation: explanations[i] || undefined,
        };
      });
      if (Object.keys(updates).length > 0) await batchUpdateQuestions(updates);
      toast.success('Đã lưu tất cả câu Gap Filling');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
      return true;
    } catch {
      toast.error('Lưu thất bại');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const save = async (): Promise<boolean> => {
    return handleSaveAll();
  };

  useImperativeHandle(ref, () => ({
    save,
  }));

  return (
    <div className="space-y-3">
      {/* ── PASSAGE SECTION ── */}
      {initialGroupContent !== undefined && (
        <div className="space-y-2">
          {/* Mode toggle bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button" size="sm"
              variant={passageMode === 'edit' ? 'default' : 'outline'}
              className={`text-xs h-7 gap-1 ${passageMode === 'edit' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              onClick={() => setPassageMode('edit')}
            >
              <PenLine className="h-3 w-3" />
              Soạn thảo
            </Button>
            <Button
              type="button" size="sm"
              variant={passageMode === 'select' ? 'default' : 'outline'}
              className={`text-xs h-7 gap-1 ${passageMode === 'select' ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
              onClick={() => setPassageMode('select')}
            >
              <MousePointerClick className="h-3 w-3" />
              Đánh dấu gap
            </Button>

            {passageMode === 'edit' && (
              <Button
                type="button" size="sm" variant="ghost"
                className="text-xs h-7 gap-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                onClick={handleCleanContent}
                title="Xóa table wrapper khi paste từ Google Docs"
              >
                <Wand2 className="h-3 w-3" />
                Làm sạch HTML
              </Button>
            )}

            {passageMode === 'select' && (
              <p className="text-[10px] text-violet-600 font-medium">Quét chọn từ → bấm &quot;Tạo gap&quot;</p>
            )}

            {paragraphItems.length > 0 && passageMode === 'select' && (
              <Button type="button" size="sm" variant="ghost" className="text-xs h-7 gap-1 text-gray-400 ml-auto" onClick={handleUndoLastGap}>
                <Undo2 className="h-3 w-3" /> Hoàn tác
              </Button>
            )}
          </div>

          {/* EDIT mode: TipTap editor */}
          {passageMode === 'edit' && (
            <div className="rounded-md border border-input bg-white overflow-hidden shadow-sm">
              {editor && <RichTextToolbar editor={editor} />}
              <EditorContent editor={editor} />
            </div>
          )}

          {/* SELECT mode: read-only rendered preview for gap selection */}
          {passageMode === 'select' && (
            <div className="relative pb-4">
              <div
                ref={passageRef}
                className="rounded-lg border border-violet-200 bg-violet-50/30 px-4 py-3 text-sm leading-7 select-text cursor-text"
                dangerouslySetInnerHTML={{ __html: renderPassageHtml(groupContentValue, items) }}
              />
              <div className="absolute bottom-0 right-2">
                <Button
                  type="button" size="sm"
                  className="h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700 shadow-lg"
                  onMouseDown={e => { e.preventDefault(); handleCreateGap(); }}
                >
                  <MousePointerClick className="h-3 w-3" /> Tạo gap
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── QUESTIONS LIST ── */}
      {items.length > 0 && (
        <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {items.map((item) => {
            const rIdx = realIndex(item);
            const isCollapsed = collapsed.has(rIdx);
            const expl = explanations[rIdx];
            const isParagraphQ = !isSentenceQ(item);

            return (
              <div key={item.id} className="bg-white">
                <div className="px-3 py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-600">Câu {item.position}</span>
                    <button type="button" onClick={() => toggleCollapsed(rIdx)}
                      className="flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 text-gray-400">
                      {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {isParagraphQ ? (
                    <MultiAnswerInput answer={item.answer}
                      onChange={val => setItems(prev => prev.map((it, j) => j === rIdx ? { ...it, answer: val } : it))} />
                  ) : (
                    <div className="space-y-2">
                      <GapSentenceInput value={item.content} onChange={val => {
                        const answer = extractAnswer(val);
                        setItems(prev => prev.map((it, j) => j === rIdx ? { ...it, content: val, answer } : it));
                      }} />
                      {item.answer && (
                        <MultiAnswerInput answer={item.answer}
                          onChange={val => setItems(prev => prev.map((it, j) => j === rIdx ? { ...it, answer: val } : it))} />
                      )}
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="px-3 pb-3 grid grid-cols-2 gap-2 border-t border-dashed border-gray-100">
                    <div className="pt-2">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Giải thích</span>
                      <textarea value={expl?.text ?? ''}
                        onChange={e => setExplanations(ex => ({ ...ex, [rIdx]: { ...ex[rIdx], text: e.target.value || undefined } }))}
                        placeholder="Tại sao đáp án này đúng?" rows={2}
                        className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
                    </div>
                    <div className="pt-2">
                      <EvidenceList evidence={expl?.evidence} pendingEvidence={pendingEvidence}
                        onAssign={onAssignEvidence} onChange={ev => handleEvidenceChange(rIdx, ev)} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
