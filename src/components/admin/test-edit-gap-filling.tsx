'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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

export function TestEditGapFilling({
  questions, groupId, groupContent: initialGroupContent, testId,
  pendingEvidence, onAssignEvidence, onEvidenceChange,
}: Props) {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const mode = initialGroupContent ? 'paragraph' : 'sentence';

  const [groupContentValue, setGroupContentValue] = useState(initialGroupContent ?? '');

  const [items, setItems] = useState(() =>
    questions.map(q => {
      const correct = q.options.find(o => o.isCorrect);
      return {
        id: q.id,
        position: q.position,
        content: q.content,
        answer: correct?.content ?? '',
      };
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

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Save groupContent if paragraph mode
      if (mode === 'paragraph' && groupContentValue !== initialGroupContent) {
        await updateQuestionGroupContent(groupId, groupContentValue);
      }

      // Save questions
      const updates: Record<string, {
        content: string;
        options: { label: string; content: string; isCorrect: boolean }[];
        explanation?: { text?: string; evidence?: string };
      }> = {};

      items.forEach((item, i) => {
        updates[String(item.id)] = {
          content: item.content,
          options: [{ label: '', content: item.answer, isCorrect: true }],
          explanation: explanations[i] || undefined,
        };
      });

      await batchUpdateQuestions(updates);
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
      {/* Paragraph mode: groupContent */}
      {mode === 'paragraph' && (
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Đoạn văn có chỗ trống</span>
          <textarea
            value={groupContentValue}
            onChange={e => setGroupContentValue(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          />
        </div>
      )}

      {/* Questions */}
      <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {items.map((item, i) => {
          const isCollapsed = collapsed.has(i);
          const expl = explanations[i];

          return (
            <div key={item.id} className="bg-white">
              <div className="px-3 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600">Câu {item.position}</span>
                  <button type="button" onClick={() => setCollapsed(prev => {
                    const next = new Set(prev);
                    isCollapsed ? next.delete(i) : next.add(i);
                    return next;
                  })}
                    className="flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 text-gray-400"
                    title={isCollapsed ? 'Hiện giải thích' : 'Ẩn giải thích'}>
                    {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {mode === 'sentence' ? (
                  <GapSentenceInput
                    value={item.content}
                    onChange={val => {
                      const answer = extractAnswer(val);
                      setItems(prev => prev.map((it, j) => j === i ? { ...it, content: val, answer } : it));
                    }}
                  />
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      value={item.answer}
                      onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, answer: e.target.value } : it))}
                      placeholder="Đáp án (nhiều đáp án cách bằng |)"
                      className="text-sm h-8"
                    />
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
                    <textarea
                      value={expl?.text ?? ''} onChange={e => setExplanations(ex => ({ ...ex, [i]: { ...ex[i], text: e.target.value || undefined } }))}
                      placeholder="Tại sao đáp án này đúng?" rows={2}
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

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSaveAll} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save all
        </Button>
      </div>
    </div>
  );
}
