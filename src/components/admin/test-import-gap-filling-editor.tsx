'use client';

import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ChevronDown, ChevronUp, MousePointerClick, Undo2 } from 'lucide-react';
import { GapSentenceInput, extractAnswer } from '@/components/admin/gap-sentence-input';
import { EvidenceList } from '@/components/admin/evidence-list';
import type { QuestionRequest } from '@/types/admin.types';

interface Props {
  questions: QuestionRequest[];
  positionOffset: number;
  groupContent?: string;
  pendingEvidence: string | null;
  onAssignEvidence: (qi: number) => void;
  onGroupContentChange?: (content: string) => void;
  onChange: (questions: QuestionRequest[]) => void;
}

/** Parse groupContent to find gap markers like [1]___ and extract the number */
function parseGapMarkers(text: string): number[] {
  const matches = [...text.matchAll(/\[(\d+)\]_{2,}/g)];
  return matches.map(m => parseInt(m[1], 10));
}

export function GapFillingEditor({
  questions, positionOffset, groupContent, pendingEvidence,
  onAssignEvidence, onGroupContentChange, onChange,
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [mode, setMode] = useState<'sentence' | 'paragraph'>(groupContent ? 'paragraph' : 'sentence');
  const [gapMode, setGapMode] = useState(false);
  const passageRef = useRef<HTMLDivElement>(null);

  // --- Sentence mode helpers (unchanged) ---
  const addQuestion = () => {
    onChange([...questions, { content: '', options: [{ label: '', content: '', isCorrect: true }] }]);
  };
  const removeQuestion = (idx: number) => {
    onChange(questions.filter((_, i) => i !== idx));
  };
  const updateContent = (idx: number, content: string) => {
    const answer = extractAnswer(content);
    onChange(questions.map((q, i) => (i === idx ? { ...q, content, options: [{ label: '', content: answer, isCorrect: true }] } : q)));
  };
  const updateExplanation = (idx: number, text: string) => {
    onChange(questions.map((q, i) =>
      i === idx ? { ...q, explanation: { ...q.explanation, text: text || undefined } } : q
    ));
  };
  const handleEvidenceChange = (idx: number, ev: string | undefined) => {
    onChange(questions.map((q, i) =>
      i === idx ? { ...q, explanation: { ...q.explanation, evidence: ev } } : q
    ));
  };
  const updateAnswer = (idx: number, answer: string) => {
    onChange(questions.map((q, i) =>
      i === idx ? { ...q, options: [{ label: '', content: answer, isCorrect: true }] } : q
    ));
  };

  // --- Click-to-gap: select text in passage → create gap ---
  const handleCreateGap = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !passageRef.current) return;
    const text = sel.toString().trim();
    if (!text) return;

    // Check selection is inside our passage div
    if (!passageRef.current.contains(sel.anchorNode!)) return;

    const currentText = groupContent ?? '';
    const selText = sel.toString();

    // Find the position of selection in the text content
    const range = sel.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(passageRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;

    // Calculate next gap number
    const existingGaps = parseGapMarkers(currentText);
    const nextNum = positionOffset + questions.length + 1;

    // Replace selected text with gap marker in the raw text
    // We need to work with the raw groupContent string
    // Find the selected text at approximately the right position
    const idx = currentText.indexOf(selText, Math.max(0, startOffset - 5));
    if (idx === -1) return;

    const before = currentText.slice(0, idx);
    const after = currentText.slice(idx + selText.length);
    const newContent = `${before}[${nextNum}]___${after}`;

    // Update groupContent
    onGroupContentChange?.(newContent);

    // Add new question with extracted answer
    onChange([...questions, {
      content: '',
      options: [{ label: '', content: text, isCorrect: true }],
    }]);

    sel.removeAllRanges();
  }, [groupContent, questions, positionOffset, onGroupContentChange, onChange]);

  // --- Undo last gap ---
  const handleUndoLastGap = useCallback(() => {
    if (questions.length === 0 || !groupContent) return;
    const lastNum = positionOffset + questions.length;
    const marker = `[${lastNum}]___`;
    const lastAnswer = questions[questions.length - 1]?.options.find(o => o.isCorrect)?.content ?? '';

    // Replace marker with original text
    const newContent = groupContent.replace(marker, lastAnswer);
    onGroupContentChange?.(newContent);
    onChange(questions.slice(0, -1));
  }, [groupContent, questions, positionOffset, onGroupContentChange, onChange]);

  // --- Render passage with highlighted gaps ---
  const renderPassageHtml = useCallback((text: string) => {
    // Replace [N]___ with styled gap markers
    return text.replace(/\[(\d+)\]_{2,}/g, (_, num) => {
      const qIdx = parseInt(num, 10) - positionOffset - 1;
      const answer = questions[qIdx]?.options.find(o => o.isCorrect)?.content ?? '';
      return `<span class="inline-flex items-baseline gap-0.5 mx-0.5"><strong style="color:#2563eb">${num}</strong><span style="display:inline-block;min-width:80px;border-bottom:2px solid #9ca3af;text-align:center;color:#9ca3af;font-size:12px;padding:0 4px">${answer || '___'}</span></span>`;
    });
  }, [questions, positionOffset]);

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 p-0.5 bg-gray-100 rounded-md w-fit">
        <button type="button" onClick={() => setMode('sentence')}
          className={`px-2.5 py-1 text-[11px] rounded transition-colors ${mode === 'sentence' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          Câu lẻ
        </button>
        <button type="button" onClick={() => setMode('paragraph')}
          className={`px-2.5 py-1 text-[11px] rounded transition-colors ${mode === 'paragraph' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          Đoạn văn
        </button>
      </div>

      {/* Paragraph mode: click-to-gap */}
      {mode === 'paragraph' && (
        <div className="space-y-2">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button type="button" size="sm" variant={gapMode ? 'default' : 'outline'}
              className={`text-xs h-7 gap-1 ${gapMode ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
              onClick={() => setGapMode(!gapMode)}>
              <MousePointerClick className="h-3 w-3" />
              {gapMode ? 'Đang đánh dấu gap...' : 'Đánh dấu gap'}
            </Button>
            {gapMode && (
              <p className="text-[10px] text-violet-600 font-medium">
                Quét chọn từ/cụm từ trong đoạn văn bên dưới → bấm &quot;Tạo gap&quot;
              </p>
            )}
            {questions.length > 0 && (
              <Button type="button" size="sm" variant="ghost" className="text-xs h-7 gap-1 text-gray-400 ml-auto" onClick={handleUndoLastGap}>
                <Undo2 className="h-3 w-3" /> Hoàn tác gap cuối
              </Button>
            )}
          </div>

          {/* Passage display */}
          {(groupContent ?? '').trim() ? (
            <div className="relative">
              <div
                ref={passageRef}
                className={`rounded-lg border px-4 py-3 text-sm leading-7 select-text ${
                  gapMode
                    ? 'border-violet-300 bg-violet-50/30 cursor-text'
                    : 'border-gray-200 bg-gray-50'
                }`}
                dangerouslySetInnerHTML={{ __html: renderPassageHtml(groupContent ?? '') }}
              />
              {/* Floating "Tạo gap" button when text is selected in gap mode */}
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
              value={groupContent ?? ''}
              onChange={e => onGroupContentChange?.(e.target.value)}
              placeholder="Dán đoạn văn gốc đầy đủ vào đây. Sau đó bật 'Đánh dấu gap' và quét chọn từ muốn tạo chỗ trống."
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          )}

          {/* Edit raw text toggle */}
          {(groupContent ?? '').trim() && (
            <details className="text-[10px]">
              <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Sửa text thô</summary>
              <textarea
                value={groupContent ?? ''}
                onChange={e => onGroupContentChange?.(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
            </details>
          )}
        </div>
      )}

      {/* Questions / Answers list */}
      {(questions.length > 0 || mode === 'sentence') && (
        <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {mode === 'paragraph' && questions.length > 0 && (
            <div className="bg-gray-50 px-3 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wide">
              Đáp án ({questions.length} gap)
            </div>
          )}
          {questions.map((q, idx) => {
            const isOpen = expanded === idx;
            const expl = q.explanation;
            const hasDetail = !!(expl?.text || expl?.evidence);
            const answer = q.options.find(o => o.isCorrect)?.content ?? '';

            return (
              <div key={idx} className="bg-white">
                <div className="px-3 py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Câu {positionOffset + idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setExpanded(isOpen ? null : idx)}
                        className={`flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 ${hasDetail ? 'text-amber-500' : 'text-gray-300'}`}
                        title="Giải thích & dẫn chứng">
                        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                      {questions.length > 1 && mode === 'sentence' && (
                        <button type="button" onClick={() => removeQuestion(idx)} className="text-gray-300 hover:text-red-500 h-7 w-7 flex items-center justify-center">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {mode === 'sentence' ? (
                    <GapSentenceInput
                      value={q.content}
                      onChange={val => updateContent(idx, val)}
                      placeholder="VD: The tomato is thought to have first grown in the Americas."
                    />
                  ) : (
                    <div className="space-y-1.5">
                      <Input
                        value={answer}
                        onChange={e => updateAnswer(idx, e.target.value)}
                        placeholder="Đáp án (nhiều đáp án cách bằng |)"
                        className="text-sm h-8"
                      />
                      {answer && (
                        <p className="text-[10px] text-green-700">
                          Đáp án: <strong>{answer.split('|')[0]}</strong>
                          {answer.includes('|') && <span className="text-gray-400 ml-1">(+{answer.split('|').length - 1} đáp án khác)</span>}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {isOpen && (
                  <div className="px-3 pb-3 grid grid-cols-2 gap-2 border-t border-dashed border-gray-100">
                    <div className="pt-2">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Giải thích</span>
                      <textarea
                        value={expl?.text ?? ''} onChange={e => updateExplanation(idx, e.target.value)}
                        placeholder="Tại sao đáp án này đúng?" rows={2}
                        className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      />
                    </div>
                    <div className="pt-2">
                      <EvidenceList
                        evidence={expl?.evidence}
                        pendingEvidence={pendingEvidence}
                        onAssign={() => onAssignEvidence(idx)}
                        onChange={ev => handleEvidenceChange(idx, ev)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mode === 'sentence' && (
        <Button type="button" size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={addQuestion}>
          <Plus className="h-3 w-3" /> Thêm câu
        </Button>
      )}
    </div>
  );
}
