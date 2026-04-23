'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { EvidenceList } from '@/components/admin/evidence-list';
import type { QuestionRequest } from '@/types/admin.types';

interface Props {
  paragraphs: string[];
  questions: QuestionRequest[];
  pendingEvidence: string | null;
  pendingOffset?: number;
  pendingStartOffset?: number;
  pendingEndOffset?: number;
  pendingStartTime?: number | null;
  onAssignEvidence: (qi: number) => void;
  onChange: (questions: QuestionRequest[]) => void;
}

export function MatchingInformationEditor({
  paragraphs,
  questions,
  pendingEvidence,
  pendingOffset,
  pendingStartOffset,
  pendingEndOffset,
  pendingStartTime,
  onAssignEvidence,
  onChange,
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

// ... (rebuild, statements, updateStatement, addStatement, removeStatement, onExpl stay same)

  const rebuild = (stmts: { content: string; correctPara: string; explanation?: QuestionRequest['explanation'] }[]) => {
    const newQuestions: QuestionRequest[] = stmts.map(s => ({
      content: s.content,
      options: paragraphs.map(p => ({ label: p, content: p, isCorrect: p === s.correctPara })),
      explanation: s.explanation,
    }));
    onChange(newQuestions);
  };

  // Derive current state from questions
  const statements = questions.map(q => {
    const correct = q.options.find(o => o.isCorrect);
    return {
      content: q.content,
      correctPara: correct?.label ?? paragraphs[0] ?? 'A',
      explanation: q.explanation,
    };
  });

  const updateStatement = (idx: number, patch: Partial<typeof statements[0]>) => {
    rebuild(statements.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  const addStatement = () => {
    rebuild([...statements, { content: '', correctPara: paragraphs[0] ?? 'A' }]);
  };

  const removeStatement = (idx: number) => {
    rebuild(statements.filter((_, i) => i !== idx));
  };

  const onExpl = (idx: number, text: string) => {
    const updated = statements.map((s, i) =>
      i === idx ? { ...s, explanation: { ...s.explanation, text: text || undefined } } : s
    );
    rebuild(updated);
  };

  const onEvidenceChange = (
    idx: number,
    ev: string | undefined,
    offsets?: number[],
    startOffsets?: number[],
    endOffsets?: number[],
    startTimes?: number[]
  ) => {
    const updated = statements.map((s, i) =>
      i === idx
        ? {
            ...s,
            explanation: {
              ...s.explanation,
              evidence: ev,
              offsets: offsets && offsets.length > 0 ? offsets : undefined,
              startOffsets: startOffsets && startOffsets.length > 0 ? startOffsets : undefined,
              endOffsets: endOffsets && endOffsets.length > 0 ? endOffsets : undefined,
              startTimes: startTimes && startTimes.length > 0 ? startTimes : undefined,
            },
          }
        : s
    );
    rebuild(updated);
  };

  if (paragraphs.length === 0) {
    return (
      <div className="border-2 border-dashed border-amber-200 rounded-lg p-4 text-center">
        <p className="text-xs text-amber-600">Không tìm thấy đoạn văn (A, B, C...) trong bài đọc.</p>
        <p className="text-xs text-gray-400 mt-1">Quay lại bước 2, đánh dấu bằng &quot;A.&quot;, &quot;B.&quot;...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400">Paragraphs: {paragraphs.join(', ')}</div>

      <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
        <div className="grid grid-cols-[32px_1fr_60px_28px] bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
          <span>#</span><span>Statement</span><span>Para</span><span />
        </div>
        {statements.map((stmt, i) => {
          const expl = stmt.explanation;
          const hasDetail = !!(expl?.text || expl?.evidence);
          const isOpen = expanded === i;
          return (
            <div key={i} className="bg-white">
              <div className="grid grid-cols-[32px_1fr_60px_28px] items-center px-3 py-2 gap-1">
                <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                <Input
                  value={stmt.content}
                  onChange={e => updateStatement(i, { content: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="text-sm h-8"
                />
                <select
                  value={stmt.correctPara}
                  onChange={e => updateStatement(i, { correctPara: e.target.value })}
                  className="rounded-md border border-input bg-background px-1.5 py-1 text-sm h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {paragraphs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className={`flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 ${hasDetail ? 'text-amber-500' : 'text-gray-300'}`}
                  title="Giải thích & dẫn chứng"
                >
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {isOpen && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-2 ml-[32px] mr-[28px] border-t border-dashed border-gray-100">
                  <div className="pt-2">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Giải thích</span>
                    <textarea
                      value={expl?.text ?? ''} onChange={e => onExpl(i, e.target.value)}
                      placeholder="Tại sao đáp án này đúng?" rows={2}
                      className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="pt-2">
                    <EvidenceList
                      evidence={expl?.evidence}
                      offsets={expl?.offsets}
                      startOffsets={expl?.startOffsets}
                      endOffsets={expl?.endOffsets}
                      startTimes={expl?.startTimes}
                      pendingOffset={pendingOffset}
                      pendingStartOffset={pendingStartOffset}
                      pendingEndOffset={pendingEndOffset}
                      pendingStartTime={pendingStartTime}
                      pendingEvidence={pendingEvidence}
                      onAssign={() => onAssignEvidence(i)}
                      onChange={(ev, offsets, startOffsets, endOffsets, startTimes) =>
                        onEvidenceChange(i, ev, offsets, startOffsets, endOffsets, startTimes)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={addStatement}>
          <Plus className="h-3 w-3" /> Thêm câu hỏi
        </Button>
        {statements.length > 1 && (
          <Button type="button" size="sm" variant="ghost" className="text-xs h-7 gap-1 text-red-500" onClick={() => removeStatement(statements.length - 1)}>
            <Trash2 className="h-3 w-3" /> Xoá cuối
          </Button>
        )}
      </div>
    </div>
  );
}
