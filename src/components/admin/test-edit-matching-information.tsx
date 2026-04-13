'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { EvidenceList } from '@/components/admin/evidence-list';
import { batchUpdateQuestions } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { detectParagraphs } from '@/components/admin/test-import-matching-headings-editor';
import type { QuestionDetail } from '@/types/test.types';

export interface TestEditMatchingInformationHandle {
  save: () => Promise<boolean>;
}

interface Props {
  questions: QuestionDetail[];
  passageHtml: string;
  testId: string;
  pendingEvidence: string | null;
  onAssignEvidence: () => void;
  onEvidenceChange: (questionId: number, evidence: string) => void;
}

export const TestEditMatchingInformation = forwardRef<TestEditMatchingInformationHandle, Props>(function TestEditMatchingInformation(
  { questions, passageHtml, testId, pendingEvidence, onAssignEvidence, onEvidenceChange }: Props,
  ref
) {
  const queryClient = useQueryClient();
  const paragraphs = detectParagraphs(passageHtml);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [statements, setStatements] = useState<{ content: string; correctPara: string }[]>(() =>
    questions.map(q => {
      const correct = q.options.find(o => o.isCorrect);
      return { content: q.content, correctPara: correct?.label ?? paragraphs[0] ?? 'A' };
    })
  );

  const [explanations, setExplanations] = useState<Record<number, { text?: string; evidence?: string }>>(() => {
    const map: Record<number, { text?: string; evidence?: string }> = {};
    questions.forEach((q, i) => {
      if (q.explanation) map[i] = { ...q.explanation };
    });
    return map;
  });

  const handleEvidenceChange = (idx: number, ev: string | undefined) => {
    setExplanations(e => ({ ...e, [idx]: { ...e[idx], evidence: ev } }));
    if (questions[idx]) onEvidenceChange(questions[idx].id, ev ?? '');
  };

  const handleSaveAll = async (): Promise<boolean> => {
    setSaving(true);
    try {
      const updates: Record<string, {
        content: string;
        options: { label: string; content: string; isCorrect: boolean }[];
        explanation?: { text?: string; evidence?: string };
      }> = {};

      questions.forEach((q, i) => {
        const stmt = statements[i];
        if (!stmt) return;
        const options = paragraphs.map(p => ({
          label: p, content: p, isCorrect: p === stmt.correctPara,
        }));
        updates[String(q.id)] = {
          content: stmt.content,
          options,
          explanation: explanations[i] || undefined,
        };
      });

      await batchUpdateQuestions(updates);
      toast.success('Đã lưu tất cả câu Matching Information');
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

  if (paragraphs.length === 0) {
    return (
      <div className="border-2 border-dashed border-amber-200 rounded-lg p-4 text-center">
        <p className="text-xs text-amber-600">Passage has no paragraphs (A, B, C...).</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400">
        Paragraphs: {paragraphs.join(', ')}
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
        <div className="grid grid-cols-[32px_1fr_60px_28px] bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
          <span>#</span><span>Statement</span><span>Para</span><span />
        </div>
        {statements.map((stmt, i) => {
          const isOpen = expanded === i;
          const expl = explanations[i];
          const hasDetail = !!(expl?.text || expl?.evidence);
          return (
            <div key={i} className="bg-white">
              <div className="grid grid-cols-[32px_1fr_60px_28px] items-center px-3 py-2 gap-1">
                <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                <Input
                  value={stmt.content}
                  onChange={e => setStatements(s => s.map((st, j) => j === i ? { ...st, content: e.target.value } : st))}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="text-sm h-8"
                />
                <select
                  value={stmt.correctPara}
                  onChange={e => setStatements(s => s.map((st, j) => j === i ? { ...st, correctPara: e.target.value } : st))}
                  className="rounded-md border border-input bg-background px-1.5 py-1 text-sm h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {paragraphs.map(p => <option key={p} value={p}>{p}</option>)}
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
                      placeholder="Why is this answer correct?" rows={2}
                      className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="pt-2">
                    <EvidenceList
                      evidence={expl?.evidence}
                      pendingEvidence={pendingEvidence}
                      onAssign={onAssignEvidence}
                      onChange={ev => handleEvidenceChange(i, ev)}
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
            onClick={() => setStatements(s => [...s, { content: '', correctPara: paragraphs[0] ?? 'A' }])}
          >
            <Plus className="h-3 w-3" /> Add question
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
