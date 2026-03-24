'use client';

import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ChevronDown, ChevronUp, MousePointerClick, Undo2 } from 'lucide-react';
import { GapSentenceInput, extractAnswer } from '@/components/admin/gap-sentence-input';
import { EvidenceList } from '@/components/admin/evidence-list';
import type { QuestionRequest } from '@/types/admin.types';

function MultiAnswerInput({ answer, onChange }: { answer: string; onChange: (v: string) => void }) {
  const answers = answer ? answer.split('|').map(a => a.trim()) : [''];
  const update = (arr: string[]) => onChange(arr.filter(a => a.trim()).join('|'));
  return (
    <div className="space-y-1">
      {answers.map((a, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input value={a} onChange={e => { const u = [...answers]; u[i] = e.target.value; update(u); }}
            placeholder={i === 0 ? 'Đáp án chính' : 'Đáp án thay thế'} className="text-sm h-7 flex-1" />
          {answers.length > 1 && (
            <button type="button" onClick={() => update(answers.filter((_, j) => j !== i))}
              className="text-gray-300 hover:text-red-500 p-0.5"><Trash2 className="h-3 w-3" /></button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => update([...answers, ''])}
        className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
        <Plus className="h-2.5 w-2.5" /> Thêm đáp án
      </button>
    </div>
  );
}

interface Props {
  questions: QuestionRequest[];
  positionOffset: number;
  groupContent?: string;
  pendingEvidence: string | null;
  onAssignEvidence: (qi: number) => void;
  onGroupContentChange?: (content: string) => void;
  onChange: (questions: QuestionRequest[]) => void;
  /** Atomically update both groupContent + questions in one parent state change */
  onBatchUpdate?: (groupContent: string, questions: QuestionRequest[]) => void;
}

/** Paragraph questions are tagged with metadata.gapMode = 'paragraph' */
const isParagraphQ = (q: QuestionRequest) => q.metadata?.gapMode === 'paragraph';
const isSentenceQ = (q: QuestionRequest) => !isParagraphQ(q);

export function GapFillingEditor({
  questions, positionOffset, groupContent, pendingEvidence,
  onAssignEvidence, onGroupContentChange, onChange, onBatchUpdate,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [gapMode, setGapMode] = useState(false);
  const passageRef = useRef<HTMLDivElement>(null);

  const toggleCollapsed = (idx: number) => {
    setCollapsed(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  };

  // Split questions by mode
  const sentenceQs = questions.filter(isSentenceQ);
  const paragraphQs = questions.filter(q => !isSentenceQ(q));

  // Get real index in full questions array
  const realIndex = (q: QuestionRequest) => questions.indexOf(q);

  // --- Sentence mode ---
  const addSentenceQuestion = () => {
    // Add with a placeholder content so it's recognized as sentence
    onChange([...questions, { content: '', options: [{ label: '', content: '', isCorrect: true }] }]);
  };

  const removeQuestion = (realIdx: number) => onChange(questions.filter((_, i) => i !== realIdx));

  const updateContent = (realIdx: number, content: string) => {
    const answer = extractAnswer(content);
    onChange(questions.map((q, i) => (i === realIdx ? { ...q, content, options: [{ label: '', content: answer, isCorrect: true }] } : q)));
  };

  const updateExplanation = (realIdx: number, text: string) => {
    onChange(questions.map((q, i) =>
      i === realIdx ? { ...q, explanation: { ...q.explanation, text: text || undefined } } : q
    ));
  };

  const handleEvidenceChange = (realIdx: number, ev: string | undefined) => {
    onChange(questions.map((q, i) =>
      i === realIdx ? { ...q, explanation: { ...q.explanation, evidence: ev } } : q
    ));
  };

  const updateAnswer = (realIdx: number, answer: string) => {
    onChange(questions.map((q, i) =>
      i === realIdx ? { ...q, options: [{ label: '', content: answer, isCorrect: true }] } : q
    ));
  };

  // --- Paragraph mode: click-to-gap ---
  const handleCreateGap = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !passageRef.current) return;
    const selectedText = sel.toString().trim();
    if (!selectedText || !passageRef.current.contains(sel.anchorNode!)) return;

    const currentText = groupContent ?? '';
    const nextNum = positionOffset + questions.length + 1;

    // Find selected text in raw groupContent
    const range = sel.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(passageRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;

    // Search in raw text (skip over existing [N]___ markers for offset)
    let idx = currentText.indexOf(selectedText, Math.max(0, startOffset - 15));
    if (idx === -1) idx = currentText.indexOf(selectedText);
    if (idx === -1) { sel.removeAllRanges(); return; }

    const newContent = currentText.slice(0, idx) + `[${nextNum}]___` + currentText.slice(idx + selectedText.length);
    const newQ: QuestionRequest = { content: '', options: [{ label: '', content: selectedText, isCorrect: true }], metadata: { gapMode: 'paragraph' } };

    // CRITICAL: update BOTH groupContent + questions atomically
    if (onBatchUpdate) {
      onBatchUpdate(newContent, [...questions, newQ]);
    } else {
      onGroupContentChange?.(newContent);
      onChange([...questions, newQ]);
    }
    sel.removeAllRanges();
  }, [groupContent, questions, positionOffset, onGroupContentChange, onChange, onBatchUpdate]);

  const handleUndoLastGap = useCallback(() => {
    if (paragraphQs.length === 0 || !groupContent) return;
    const lastQ = paragraphQs[paragraphQs.length - 1];
    const lastRealIdx = realIndex(lastQ);
    const lastNum = positionOffset + lastRealIdx + 1;
    const lastAnswer = lastQ.options.find(o => o.isCorrect)?.content ?? '';
    const newContent = groupContent.replace(`[${lastNum}]___`, lastAnswer);
    const newQuestions = questions.filter((_, i) => i !== lastRealIdx);

    if (onBatchUpdate) {
      onBatchUpdate(newContent, newQuestions);
    } else {
      onGroupContentChange?.(newContent);
      onChange(newQuestions);
    }
  }, [groupContent, questions, paragraphQs, positionOffset, onGroupContentChange, onChange, onBatchUpdate]);

  // --- Render passage HTML with gap markers ---
  const renderPassageHtml = useCallback((text: string) => {
    return text.replace(/\[(\d+)\]_{2,}/g, (_, num) => {
      const gapNum = parseInt(num, 10);
      const rIdx = gapNum - positionOffset - 1;
      const answer = questions[rIdx]?.options.find(o => o.isCorrect)?.content ?? '';
      return `<span style="display:inline-flex;align-items:baseline;gap:2px;margin:0 2px"><strong style="color:#2563eb;font-size:13px">${num}</strong><span style="display:inline-block;min-width:80px;border-bottom:2px solid #9ca3af;text-align:center;color:#16a34a;font-size:12px;padding:0 4px;font-weight:600">${answer || '___'}</span></span>`;
    });
  }, [questions, positionOffset]);

  return (
    <div className="space-y-3">
      {/* === PARAGRAPH SECTION (always visible if groupContent exists) === */}
      {(groupContent ?? '').trim() !== '' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Button type="button" size="sm" variant={gapMode ? 'default' : 'outline'}
              className={`text-xs h-7 gap-1 ${gapMode ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
              onClick={() => setGapMode(!gapMode)}>
              <MousePointerClick className="h-3 w-3" />
              {gapMode ? 'Đang đánh dấu...' : 'Đánh dấu gap'}
            </Button>
            {gapMode && <p className="text-[10px] text-violet-600 font-medium">Quét chọn từ → bấm &quot;Tạo gap&quot;</p>}
            {paragraphQs.length > 0 && (
              <Button type="button" size="sm" variant="ghost" className="text-xs h-7 gap-1 text-gray-400 ml-auto" onClick={handleUndoLastGap}>
                <Undo2 className="h-3 w-3" /> Hoàn tác
              </Button>
            )}
          </div>

          {(groupContent ?? '').trim() ? (
            <div className="relative">
              <div ref={passageRef}
                className={`rounded-lg border px-4 py-3 text-sm leading-7 select-text ${gapMode ? 'border-violet-300 bg-violet-50/30 cursor-text' : 'border-gray-200 bg-gray-50'}`}
                dangerouslySetInnerHTML={{ __html: renderPassageHtml(groupContent ?? '') }}
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
            <textarea
              value=""
              onChange={e => onGroupContentChange?.(e.target.value)}
              placeholder="Dán đoạn văn gốc đầy đủ vào đây. Sau đó bật 'Đánh dấu gap' và quét chọn từ muốn tạo chỗ trống."
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          )}

          {(groupContent ?? '').trim() && (
            <details className="text-[10px]">
              <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Sửa text thô</summary>
              <textarea value={groupContent ?? ''} onChange={e => onGroupContentChange?.(e.target.value)} rows={4}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y" />
            </details>
          )}
        </div>
      )}

      {/* === ALL QUESTIONS LIST === */}
      {questions.length > 0 && (
        <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {paragraphQs.length > 0 && (
            <div className="bg-gray-50 px-3 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wide">
              {sentenceQs.length > 0 ? `${questions.length} câu (${sentenceQs.length} câu lẻ + ${paragraphQs.length} gap)` : `${paragraphQs.length} gap`}
            </div>
          )}
          {questions.map((q) => {
            const rIdx = realIndex(q);
            const isCollapsed = collapsed.has(rIdx);
            const expl = q.explanation;
            const answer = q.options.find(o => o.isCorrect)?.content ?? '';

            return (
              <div key={rIdx} className="bg-white">
                <div className="px-3 py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Câu {positionOffset + rIdx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => toggleCollapsed(rIdx)}
                        className="flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 text-gray-400">
                        {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                      </button>
                      {isSentenceQ(q) && (
                        <button type="button" onClick={() => removeQuestion(rIdx)} className="text-gray-300 hover:text-red-500 h-7 w-7 flex items-center justify-center">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isSentenceQ(q) ? (
                    <GapSentenceInput value={q.content} onChange={val => updateContent(rIdx, val)}
                      placeholder="Nhập câu đầy đủ, quét từ cần trống → bấm Đánh dấu" />
                  ) : (
                    <MultiAnswerInput answer={answer} onChange={val => updateAnswer(rIdx, val)} />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="px-3 pb-3 grid grid-cols-2 gap-2 border-t border-dashed border-gray-100">
                    <div className="pt-2">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Giải thích</span>
                      <textarea value={expl?.text ?? ''} onChange={e => updateExplanation(rIdx, e.target.value)}
                        placeholder="Tại sao đáp án này đúng?" rows={2}
                        className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
                    </div>
                    <div className="pt-2">
                      <EvidenceList evidence={expl?.evidence} pendingEvidence={pendingEvidence}
                        onAssign={() => onAssignEvidence(rIdx)} onChange={ev => handleEvidenceChange(rIdx, ev)} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add question buttons */}
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={addSentenceQuestion}>
          <Plus className="h-3 w-3" /> Thêm câu lẻ
        </Button>
        {!(groupContent ?? '').trim() && (
          <Button type="button" size="sm" variant="outline" className="text-xs h-7 gap-1"
            onClick={() => onGroupContentChange?.('')}>
            <Plus className="h-3 w-3" /> Thêm đoạn văn
          </Button>
        )}
      </div>
    </div>
  );
}
