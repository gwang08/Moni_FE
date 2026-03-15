'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { QuestionRequest } from '@/types/admin.types';

interface SharedOption {
  label: string;
  content: string;
}

interface Props {
  questions: QuestionRequest[];
  sharedOptions: SharedOption[];
  positionOffset: number;
  pendingEvidence?: string | null;
  onAssignEvidence?: (questionIndex: number) => void;
  onChange: (questions: QuestionRequest[]) => void;
}

export function MatchingTableEditor({ questions, sharedOptions, positionOffset, pendingEvidence, onAssignEvidence, onChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const addQuestion = () => {
    onChange([...questions, { content: '', options: [] }]);
  };

  const removeQuestion = (idx: number) => {
    onChange(questions.filter((_, i) => i !== idx));
    if (expanded === idx) setExpanded(null);
  };

  const updateContent = (idx: number, content: string) => {
    onChange(questions.map((q, i) => (i === idx ? { ...q, content } : q)));
  };

  const updateAnswer = (idx: number, correctLabel: string) => {
    const options = correctLabel
      ? sharedOptions.map(opt => ({ label: opt.label, content: opt.content, isCorrect: opt.label === correctLabel }))
      : [];
    onChange(questions.map((q, i) => (i === idx ? { ...q, options } : q)));
  };

  const updateExplanationText = (idx: number, text: string) => {
    onChange(questions.map((q, i) => {
      if (i !== idx) return q;
      const expl = { ...q.explanation, text: text || undefined };
      return { ...q, explanation: (expl.text || expl.evidence) ? expl : undefined };
    }));
  };

  const updateExplanationEvidence = (idx: number, evidence: string) => {
    onChange(questions.map((q, i) => {
      if (i !== idx) return q;
      const expl = { ...q.explanation, evidence: evidence || undefined };
      return { ...q, explanation: (expl.text || expl.evidence) ? expl : undefined };
    }));
  };

  const assignEvidence = (idx: number) => {
    if (!pendingEvidence) return;
    const current = questions[idx].explanation?.evidence;
    const updated = current ? `${current}\n---\n${pendingEvidence}` : pendingEvidence;
    updateExplanationEvidence(idx, updated);
    onAssignEvidence?.(idx);
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_80px_28px_32px] bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-500">
          <span>#</span>
          <span>Nội dung câu hỏi</span>
          <span>Đáp án</span>
          <span />
          <span />
        </div>

        {/* Rows */}
        {questions.map((q, idx) => {
          const isOpen = expanded === idx;
          const hasDetail = !!(q.explanation?.text || q.explanation?.evidence);
          return (
            <div key={idx} className="bg-white">
              <div className="grid grid-cols-[40px_1fr_80px_28px_32px] items-center px-2 py-1.5 gap-1">
                <span className="text-xs font-semibold text-gray-400">{positionOffset + idx + 1}</span>
                <Input
                  value={q.content}
                  onChange={e => updateContent(idx, e.target.value)}
                  placeholder="VD: Statement about..."
                  className="text-sm h-8"
                />
                <select
                  value={q.options.find(o => o.isCorrect)?.label || ''}
                  onChange={e => updateAnswer(idx, e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">--</option>
                  {sharedOptions.map(opt => (
                    <option key={opt.label} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : idx)}
                  className={`flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 ${hasDetail ? 'text-amber-500' : 'text-gray-300'}`}
                >
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                <button type="button" onClick={() => removeQuestion(idx)} className="text-gray-300 hover:text-red-500 justify-self-center">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {isOpen && (
                <div className="px-2 pb-3 ml-[40px] mr-[60px] border-t border-dashed border-gray-100 space-y-2 pt-2">
                  <div>
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Giải thích</span>
                    <textarea
                      value={q.explanation?.text ?? ''}
                      onChange={e => updateExplanationText(idx, e.target.value)}
                      placeholder="Tại sao đáp án này đúng?"
                      rows={2}
                      className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Dẫn chứng</span>
                      {pendingEvidence && (
                        <button type="button" onClick={() => assignEvidence(idx)}
                          className="text-[10px] text-green-600 hover:text-green-800 font-medium">
                          + Gán dẫn chứng đã quét
                        </button>
                      )}
                    </div>
                    <textarea
                      value={q.explanation?.evidence ?? ''}
                      onChange={e => updateExplanationEvidence(idx, e.target.value)}
                      placeholder="Trích dẫn đoạn văn liên quan..."
                      rows={2}
                      className="mt-1 w-full rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {questions.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-gray-400">Chưa có câu hỏi</div>
        )}
      </div>

      <Button type="button" size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={addQuestion}>
        <Plus className="h-3 w-3" /> Thêm câu
      </Button>
    </div>
  );
}
