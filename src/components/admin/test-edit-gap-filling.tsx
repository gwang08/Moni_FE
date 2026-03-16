'use client';

import { useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ChevronDown, ChevronUp, MousePointerClick, Undo2 } from 'lucide-react';
import { EvidenceList } from '@/components/admin/evidence-list';
import { GapSentenceInput, extractAnswer } from '@/components/admin/gap-sentence-input';
import { batchUpdateQuestions, updateQuestionGroupContent } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { QuestionDetail } from '@/types/test.types';

interface Props {
  questions: QuestionDetail[];
  groupId: number;
  groupContent?: string;
  testId: string;
  pendingEvidence: string | null;
  onAssignEvidence: () => void;
  onEvidenceChange: (questionId: number, evidence: string) => void;
}

/** Sentence questions have content with text; paragraph questions have empty content */
const isSentenceQ = (q: { content: string }) => q.content.trim().length > 0;

export function TestEditGapFilling({
  questions, groupId, groupContent: initialGroupContent, testId,
  pendingEvidence, onAssignEvidence, onEvidenceChange,
}: Props) {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'sentence' | 'paragraph'>(initialGroupContent ? 'paragraph' : 'sentence');
  const [gapMode, setGapMode] = useState(false);
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

  const sentenceItems = items.filter(it => isSentenceQ(it));
  const paragraphItems = items.filter(it => !isSentenceQ(it));
  const displayItems = mode === 'sentence' ? sentenceItems : paragraphItems;

  const realIndex = (item: typeof items[0]) => items.indexOf(item);

  const toggleCollapsed = (idx: number) => {
    setCollapsed(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  };

  const handleEvidenceChange = (idx: number, ev: string | undefined) => {
    setExplanations(e => ({ ...e, [idx]: { ...e[idx], evidence: ev } }));
    if (questions[idx]) onEvidenceChange(questions[idx].id, ev ?? '');
  };

  // --- Paragraph: click-to-gap ---
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
  }, [paragraphItems, items]);

  const renderPassageHtml = useCallback((text: string) => {
    return text.replace(/\[(\d+)\]_{2,}/g, (_, num) => {
      const rIdx = parseInt(num, 10) - 1;
      const answer = items[rIdx]?.answer ?? '';
      return `<span style="display:inline-flex;align-items:baseline;gap:2px;margin:0 2px"><strong style="color:#2563eb;font-size:13px">${num}</strong><span style="display:inline-block;min-width:80px;border-bottom:2px solid #9ca3af;text-align:center;color:#16a34a;font-size:12px;padding:0 4px;font-weight:600">${answer || '___'}</span></span>`;
    });
  }, [items]);

  // --- Save ---
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if (groupContentValue !== (initialGroupContent ?? '')) {
        await updateQuestionGroupContent(groupId, groupContentValue);
      }
      const updates: Record<string, { content: string; options: { label: string; content: string; isCorrect: boolean }[]; explanation?: { text?: string; evidence?: string } }> = {};
      items.forEach((item, i) => {
        if (item.id < 0) return; // skip new unsaved items (need createQuestion instead)
        updates[String(item.id)] = {
          content: item.content,
          options: [{ label: '', content: item.answer, isCorrect: true }],
          explanation: explanations[i] || undefined,
        };
      });
      if (Object.keys(updates).length > 0) await batchUpdateQuestions(updates);
      toast.success('Đã lưu tất cả câu Gap Filling');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 p-0.5 bg-gray-100 rounded-md w-fit">
        <button type="button" onClick={() => { setMode('sentence'); setGapMode(false); }}
          className={`px-2.5 py-1 text-[11px] rounded transition-colors ${mode === 'sentence' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          Câu lẻ {sentenceItems.length > 0 && `(${sentenceItems.length})`}
        </button>
        <button type="button" onClick={() => setMode('paragraph')}
          className={`px-2.5 py-1 text-[11px] rounded transition-colors ${mode === 'paragraph' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          Đoạn văn {paragraphItems.length > 0 && `(${paragraphItems.length})`}
        </button>
      </div>

      {/* === PARAGRAPH MODE === */}
      {mode === 'paragraph' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Button type="button" size="sm" variant={gapMode ? 'default' : 'outline'}
              className={`text-xs h-7 gap-1 ${gapMode ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
              onClick={() => setGapMode(!gapMode)}>
              <MousePointerClick className="h-3 w-3" />
              {gapMode ? 'Đang đánh dấu...' : 'Đánh dấu gap'}
            </Button>
            {gapMode && <p className="text-[10px] text-violet-600 font-medium">Quét chọn từ → bấm &quot;Tạo gap&quot;</p>}
            {paragraphItems.length > 0 && (
              <Button type="button" size="sm" variant="ghost" className="text-xs h-7 gap-1 text-gray-400 ml-auto" onClick={handleUndoLastGap}>
                <Undo2 className="h-3 w-3" /> Hoàn tác
              </Button>
            )}
          </div>

          {groupContentValue.trim() ? (
            <div className="relative">
              <div ref={passageRef}
                className={`rounded-lg border px-4 py-3 text-sm leading-7 select-text ${gapMode ? 'border-violet-300 bg-violet-50/30 cursor-text' : 'border-gray-200 bg-gray-50'}`}
                dangerouslySetInnerHTML={{ __html: renderPassageHtml(groupContentValue) }}
              />
              {gapMode && (
                <div className="absolute -bottom-1 right-2">
                  <Button type="button" size="sm" className="h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700 shadow-lg"
                    onMouseDown={e => { e.preventDefault(); handleCreateGap(); }}>
                    <MousePointerClick className="h-3 w-3" /> Tạo gap
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <textarea value={groupContentValue} onChange={e => setGroupContentValue(e.target.value)}
              placeholder="Dán đoạn văn gốc đầy đủ vào đây."
              rows={5} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y" />
          )}

          {groupContentValue.trim() && (
            <details className="text-[10px]">
              <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Sửa text thô</summary>
              <textarea value={groupContentValue} onChange={e => setGroupContentValue(e.target.value)} rows={4}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y" />
            </details>
          )}
        </div>
      )}

      {/* === QUESTIONS LIST (filtered by mode) === */}
      {displayItems.length > 0 && (
        <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {mode === 'paragraph' && (
            <div className="bg-gray-50 px-3 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wide">
              Đáp án ({paragraphItems.length} gap)
            </div>
          )}
          {displayItems.map((item) => {
            const rIdx = realIndex(item);
            const isCollapsed = collapsed.has(rIdx);
            const expl = explanations[rIdx];

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

                  {mode === 'sentence' ? (
                    <GapSentenceInput value={item.content} onChange={val => {
                      const answer = extractAnswer(val);
                      setItems(prev => prev.map((it, j) => j === rIdx ? { ...it, content: val, answer } : it));
                    }} />
                  ) : (
                    <div className="space-y-1.5">
                      <Input value={item.answer}
                        onChange={e => setItems(prev => prev.map((it, j) => j === rIdx ? { ...it, answer: e.target.value } : it))}
                        placeholder="Đáp án (nhiều đáp án cách bằng |)" className="text-sm h-8" />
                      {item.answer && (
                        <p className="text-[10px] text-green-700">
                          Đáp án: <strong>{item.answer.split('|')[0]}</strong>
                          {item.answer.includes('|') && <span className="text-gray-400 ml-1">(+{item.answer.split('|').length - 1} đáp án khác)</span>}
                        </p>
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

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSaveAll} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Lưu tất cả
        </Button>
      </div>
    </div>
  );
}
