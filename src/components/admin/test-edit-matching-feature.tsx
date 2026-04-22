'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { EvidenceList } from '@/components/admin/evidence-list';
import { batchUpdateQuestions } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { QuestionDetail } from '@/types/test.types';

export interface TestEditMatchingFeatureHandle {
  save: () => Promise<boolean>;
}

interface Props {
  questions: QuestionDetail[];
  testId: string;
  pendingEvidence: string | null;
  pendingOffset?: number;
  onAssignEvidence: () => void;
  onEvidenceChange: (questionId: number, evidence: string, offsets?: number[]) => void;
}

export const TestEditMatchingFeature = forwardRef<TestEditMatchingFeatureHandle, Props>(function TestEditMatchingFeature(
  { questions, testId, pendingEvidence, pendingOffset, onAssignEvidence, onEvidenceChange }: Props,
  ref
) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Extract unique categories from first question's options
  const [categories, setCategories] = useState<{ label: string; content: string }[]>(() => {
    const opts = questions[0]?.options ?? [];
    return opts.map(o => ({ label: o.label, content: o.content }));
  });

  const [statements, setStatements] = useState<{ content: string; correctLabel: string }[]>(() =>
    questions.map(q => {
      const correct = q.options.find(o => o.isCorrect);
      return { content: q.content, correctLabel: correct?.label ?? categories[0]?.label ?? 'A' };
    })
  );

  const [explanations, setExplanations] = useState<Record<number, { text?: string; evidence?: string; offsets?: number[] }>>(() => {
    const map: Record<number, { text?: string; evidence?: string; offsets?: number[] }> = {};
    questions.forEach((q, i) => {
      if (q.explanation) map[i] = { ...q.explanation };
    });
    return map;
  });

  const addCategory = () => {
    const nextLabel = String.fromCharCode(65 + categories.length);
    setCategories(c => [...c, { label: nextLabel, content: '' }]);
  };

  const removeCategory = (idx: number) => {
    const updated = categories.filter((_, i) => i !== idx).map((c, i) => ({ ...c, label: String.fromCharCode(65 + i) }));
    setCategories(updated);
  };

  const handleEvidenceChange = (idx: number, ev: string | undefined, nextOffsets?: number[]) => {
    setExplanations(e => ({ ...e, [idx]: { ...e[idx], evidence: ev, offsets: nextOffsets } }));
    if (questions[idx]) onEvidenceChange(questions[idx].id, ev ?? '', nextOffsets);
  };

  const handleSaveAll = async (): Promise<boolean> => {
    setSaving(true);
    try {
      const updates: Record<string, {
        content: string;
        options: { label: string; content: string; isCorrect: boolean }[];
        explanation?: { text?: string; evidence?: string; offsets?: number[] };
      }> = {};

      questions.forEach((q, i) => {
        const stmt = statements[i];
        if (!stmt) return;
        const options = categories.map(c => ({
          label: c.label,
          content: c.content,
          isCorrect: c.label === stmt.correctLabel,
        }));
        updates[String(q.id)] = {
          content: stmt.content,
          options,
          explanation: explanations[i] || undefined,
        };
      });

      await batchUpdateQuestions(updates);
      toast.success('Đã lưu tất cả câu Matching Features');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
      return true;
    } catch {
      toast.error('Lưu thất bại');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSaveAll,
  }));

  return (
    <div className="space-y-3">
      {/* Category list */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
        <span className="block text-xs font-semibold text-amber-800">
          Danh sách categories ({categories.length})
        </span>
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 w-6 text-center shrink-0">{cat.label}</span>
            <Input
              value={cat.content}
              onChange={e => setCategories(c => c.map((cc, j) => j === i ? { ...cc, content: e.target.value } : cc))}
              placeholder={`Category ${cat.label}...`}
              className="text-sm h-8"
            />
            {categories.length > 1 && (
              <button type="button" onClick={() => removeCategory(i)} className="text-amber-400 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        <Button type="button" size="sm" variant="ghost" className="text-xs h-7 gap-1 text-amber-700" onClick={addCategory}>
          <Plus className="h-3 w-3" /> Add category
        </Button>
      </div>

      {/* Statements table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
        <div className="grid grid-cols-[32px_1fr_minmax(100px,180px)_28px] bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
          <span>#</span><span>Statement</span><span>Đáp án</span><span />
        </div>
        {statements.map((stmt, i) => {
          const isOpen = expanded === i;
          const expl = explanations[i];
          const hasDetail = !!(expl?.text || expl?.evidence);
          return (
            <div key={i} className="bg-white">
              <div className="grid grid-cols-[32px_1fr_minmax(100px,180px)_28px] items-center px-3 py-2 gap-1">
                <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                <Input
                  value={stmt.content}
                  onChange={e => setStatements(s => s.map((st, j) => j === i ? { ...st, content: e.target.value } : st))}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="text-sm h-8"
                />
                <select
                  value={stmt.correctLabel}
                  onChange={e => setStatements(s => s.map((st, j) => j === i ? { ...st, correctLabel: e.target.value } : st))}
                  className="rounded-md border border-input bg-background px-1.5 py-1 text-sm h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title={categories.find(c => c.label === stmt.correctLabel)?.content}
                >
                  {categories.map(c => (
                    <option key={c.label} value={c.label}>
                      {c.label}. {c.content ? (c.content.length > 25 ? c.content.slice(0, 25) + '…' : c.content) : '(chưa nhập)'}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className={`flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 ${hasDetail ? 'text-amber-500' : 'text-gray-300'}`}
                >
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {isOpen && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-2 ml-[32px] mr-[28px] border-t border-dashed border-gray-100">
                  <div className="pt-2">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Explanation</span>
                    <textarea
                      value={expl?.text ?? ''}
                      onChange={e => setExplanations(ex => ({ ...ex, [i]: { ...ex[i], text: e.target.value || undefined } }))}
                      placeholder="Why is this correct?" rows={2}
                      className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="pt-2">
                    <EvidenceList
                      evidence={expl?.evidence}
                      offsets={expl?.offsets}
                      pendingEvidence={pendingEvidence}
                      pendingOffset={pendingOffset}
                      onAssign={onAssignEvidence}
                      onChange={(ev, offsets) => handleEvidenceChange(i, ev, offsets)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-start">
        <div className="flex gap-2">
          <Button
            type="button" size="sm" variant="outline" className="text-xs h-7 gap-1"
            onClick={() => setStatements(s => [...s, { content: '', correctLabel: categories[0]?.label ?? 'A' }])}
          >
            <Plus className="h-3 w-3" /> Add statement
          </Button>
          {statements.length > 1 && (
            <Button
              type="button" size="sm" variant="ghost" className="text-xs h-7 gap-1 text-red-500"
              onClick={() => {
                const last = statements.length - 1;
                setStatements(s => s.slice(0, -1));
                setExplanations(e => { const n = { ...e }; delete n[last]; return n; });
              }}
            >
              <Trash2 className="h-3 w-3" /> Remove last
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
