'use client';

import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateQuestion } from '@/lib/admin-api';
import type { TestDetailResponse } from '@/types/test.types';

interface Props {
  test: TestDetailResponse;
  onBeforeSaveBasicInfo?: () => Promise<boolean> | boolean;
}

export interface TestEditSpeakingContentHandle {
  saveAll: (silent?: boolean) => Promise<boolean>;
}

type QuestionEdit = {
  content: string;
  sample: string;
};

function getPartTitle(index: number): string {
  if (index === 0) return 'Part 1: Introduction & Interview';
  if (index === 1) return 'Part 2: Long Turn (Cue Card)';
  return 'Part 3: Two-way Discussion';
}

function getPartTone(index: number): 'blue' | 'amber' | 'emerald' {
  if (index === 0) return 'blue';
  if (index === 1) return 'amber';
  return 'emerald';
}

export const TestEditSpeakingContent = forwardRef<TestEditSpeakingContentHandle, Props>(function TestEditSpeakingContent(
  { test, onBeforeSaveBasicInfo },
  ref
) {
  const queryClient = useQueryClient();
  const testId = String(test.id);
  const [saving, setSaving] = useState(false);

  const parts = useMemo(
    () =>
      test.stimuli.map((stimulus, idx) => {
        const partBase0 = test.section ? test.section - 1 : (stimulus.section ? stimulus.section - 1 : idx);

        const group = stimulus.questionGroups[0];
        const questions = group?.questions ?? [];
        const transition = questions.find((q) => q.position === 0) ?? null;
        const cueCard = questions.find((q) => q.position === 1) ?? null;
        const mainQuestions = questions.filter((q) => (q.position ?? 0) > 0);

        return {
          stimulusId: stimulus.id,
          partIdx: partBase0,
          originalIdx: idx,
          title: getPartTitle(partBase0),
          tone: getPartTone(partBase0),
          questions,
          transition,
          cueCard,
          mainQuestions,
          groupId: group?.id ?? null,
        };
      }),
    [test.stimuli, test.section]
  );

  const [edits, setEdits] = useState<Record<number, QuestionEdit>>(() => {
    const map: Record<number, QuestionEdit> = {};
    for (const stimulus of test.stimuli) {
      for (const group of stimulus.questionGroups) {
        for (const q of group.questions) {
          map[q.id] = {
            content: q.content,
            sample: q.explanation?.text || '',
          };
        }
      }
    }
    return map;
  });

  const updateEdit = (id: number, patch: Partial<QuestionEdit>) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      },
    }));
  };

  const handleSaveAll = async (silent = false) => {
    setSaving(true);
    try {
      if (!silent && onBeforeSaveBasicInfo) {
        const canContinue = await onBeforeSaveBasicInfo();
        if (canContinue === false) return false;
      }

      const updates: Promise<void>[] = [];

      for (const stimulus of test.stimuli) {
        for (const group of stimulus.questionGroups) {
          for (const q of group.questions) {
            const edit = edits[q.id];
            if (!edit) continue;

            const nextContent = edit.content.trim();
            const nextSample = edit.sample.trim();
            const currentSample = q.explanation?.text || '';

            if (nextContent !== q.content || nextSample !== currentSample) {
              updates.push(
                updateQuestion(String(q.id), {
                  content: nextContent,
                  explanation: nextSample ? { text: nextSample } : undefined,
                })
              );
            }
          }
        }
      }

      await Promise.all(updates);
      if (!silent) toast.success('Đã lưu Speaking');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
      return true;
    } catch {
      if (!silent) toast.error('Lưu thất bại');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    saveAll: (silent?: boolean) => handleSaveAll(silent),
  }));

  if (parts.length === 0) return <p className="py-8 text-center text-sm text-gray-400">Chưa có nội dung Speaking</p>;

  return (
    <div className="space-y-5">
      {parts.map((part) => {
        const color =
          part.tone === 'blue'
            ? { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700' }
            : part.tone === 'amber'
              ? { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' }
              : { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' };

        return (
          <section key={part.stimulusId} className={`rounded-xl border ${color.border} overflow-hidden bg-white`}>
            <div className={`${color.bg} px-4 py-3 border-b ${color.border} flex items-center justify-between`}>
              <div>
                <h3 className={`text-sm font-semibold ${color.text}`}>{part.title}</h3>
                <p className="text-xs text-gray-500">
                  {part.partIdx === 0
                    ? `${part.mainQuestions.length} câu hỏi`
                    : part.partIdx === 1
                      ? 'Transition + Cue Card'
                      : `${part.mainQuestions.length} câu hỏi`}
                </p>
              </div>
              <span className="text-xs text-gray-400">Stimulus #{part.originalIdx + 1}</span>
            </div>

            <div className="space-y-4 p-4">
              {part.transition && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase text-gray-500">Transition</p>
                  <textarea
                    value={edits[part.transition.id]?.content ?? part.transition.content}
                    onChange={(e) => updateEdit(part.transition!.id, { content: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>
              )}

              {part.partIdx === 1 && part.cueCard && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase text-amber-600">Cue Card</p>
                  <textarea
                    value={edits[part.cueCard.id]?.content ?? part.cueCard.content}
                    onChange={(e) => updateEdit(part.cueCard!.id, { content: e.target.value })}
                    rows={5}
                    className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
                  />
                </div>
              )}

              {part.partIdx !== 1 && part.mainQuestions.map((q, index) => {
                const edit = edits[q.id] ?? { content: q.content, sample: q.explanation?.text || '' };
                return (
                  <div key={q.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
                        Câu {index + 1}
                      </span>
                      <Input
                        value={edit.content}
                        onChange={(e) => updateEdit(q.id, { content: e.target.value })}
                        className="h-8 flex-1 text-sm"
                      />
                    </div>
                    <textarea
                      value={edit.sample}
                      onChange={(e) => updateEdit(q.id, { sample: e.target.value })}
                      placeholder="Gợi ý / bài mẫu (tuỳ chọn)..."
                      rows={2}
                      className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
});
