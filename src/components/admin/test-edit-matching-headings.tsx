'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ChevronDown, ChevronUp, Plus, Trash2, Highlighter } from 'lucide-react';
import { updateQuestion } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { detectParagraphs } from '@/components/admin/test-import-matching-headings-editor';
import type { QuestionDetail } from '@/types/test.types';

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];

function buildParaMap(questions: QuestionDetail[]): Record<string, QuestionDetail> {
  const map: Record<string, QuestionDetail> = {};
  for (const q of questions) {
    const m = q.content.match(/(?:Paragraph\s+)?([A-Z])\b/i);
    if (m) map[m[1].toUpperCase()] = q;
  }
  return map;
}

interface Props {
  questions: QuestionDetail[];
  passageHtml: string;
  testId: string;
  pendingEvidence: string | null;
  onAssignEvidence: () => void;
  onEvidenceChange: (questionId: number, evidence: string) => void;
}

export function TestEditMatchingHeadings({ questions, passageHtml, testId, pendingEvidence, onAssignEvidence, onEvidenceChange }: Props) {
  const queryClient = useQueryClient();
  const paragraphs = detectParagraphs(passageHtml);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const paraToQuestion = buildParaMap(questions);
  const paraLabels = new Set(paragraphs.map((_, i) => ROMAN[i]));
  const allOptionLabels = questions[0]?.options.map(o => o.label) ?? [];
  const distractorLabels = allOptionLabels.filter(l => !paraLabels.has(l));

  const [headings, setHeadings] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const [para, q] of Object.entries(paraToQuestion)) {
      const correct = q.options.find(o => o.isCorrect);
      if (correct) map[para] = correct.content;
    }
    return map;
  });
  const [explanations, setExplanations] = useState<Record<string, { text?: string; evidence?: string }>>(() => {
    const map: Record<string, { text?: string; evidence?: string }> = {};
    for (const [para, q] of Object.entries(paraToQuestion)) {
      if (q.explanation) map[para] = { ...q.explanation };
    }
    return map;
  });
  const [distractors, setDistractors] = useState<string[]>(() =>
    distractorLabels.map(l => questions[0]?.options.find(o => o.label === l)?.content ?? '')
  );

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const allOptions: { label: string; content: string }[] = [];
      paragraphs.forEach((p, i) => { const c = headings[p] ?? ''; if (c.trim()) allOptions.push({ label: ROMAN[i], content: c }); });
      distractors.forEach((d, i) => { if (d.trim()) allOptions.push({ label: ROMAN[paragraphs.length + i], content: d }); });
      const promises = paragraphs.map((p, i) => {
        const q = paraToQuestion[p];
        if (!q) return Promise.resolve();
        const myLabel = ROMAN[i];
        const options = allOptions.map(o => ({ label: o.label, content: o.content, isCorrect: o.label === myLabel }));
        return updateQuestion(String(q.id), { content: q.content, options, explanation: explanations[p] || undefined });
      });
      await Promise.all(promises);
      toast.success('Đã lưu tất cả câu matching headings');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
    } catch { toast.error('Lưu thất bại'); } finally { setSaving(false); }
  };

  const handleAssign = (para: string, questionId: number) => {
    if (!pendingEvidence) return;
    setExplanations(e => ({ ...e, [para]: { ...e[para], evidence: pendingEvidence } }));
    onEvidenceChange(questionId, pendingEvidence);
    onAssignEvidence();
  };

  if (paragraphs.length === 0) {
    return (
      <div className="border-2 border-dashed border-amber-200 rounded-lg p-4 text-center">
        <p className="text-xs text-amber-600">Không tìm thấy đoạn văn (Paragraph A, B, C...) trong bài đọc.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
        <div className="grid grid-cols-[36px_1fr_28px] bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
          <span>Para</span><span>Heading</span><span />
        </div>
        {paragraphs.map((p, i) => {
          const q = paraToQuestion[p];
          const heading = headings[p] ?? '';
          const expl = explanations[p];
          const isOpen = expanded === p;
          const hasDetail = !!(expl?.text || expl?.evidence);
          return (
            <div key={p} className="bg-white">
              <div className="grid grid-cols-[36px_1fr_28px] items-center px-3 py-2 gap-1">
                <span className="text-sm font-bold text-blue-600">{p}</span>
                <Input value={heading} onChange={e => setHeadings(h => ({ ...h, [p]: e.target.value }))} placeholder="Nội dung heading..." className="text-sm h-8" />
                <button type="button" onClick={() => setExpanded(isOpen ? null : p)}
                  className={`flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 ${hasDetail ? 'text-amber-500' : 'text-gray-300'}`}>
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
              {isOpen && q && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-2 ml-[36px] mr-[28px] border-t border-dashed border-gray-100">
                  <div className="pt-2">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Giải thích</span>
                    <textarea value={expl?.text ?? ''} onChange={e => setExplanations(ex => ({ ...ex, [p]: { ...ex[p], text: e.target.value || undefined } }))}
                      placeholder="Tại sao heading này đúng?" rows={2}
                      className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Dẫn chứng</span>
                      {pendingEvidence && (
                        <Button type="button" size="sm" variant="default" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={() => handleAssign(p, q.id)}>
                          <Highlighter className="h-2.5 w-2.5" /> Gán
                        </Button>
                      )}
                    </div>
                    {expl?.evidence ? (
                      <div className="relative mt-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900 whitespace-pre-wrap max-h-20 overflow-y-auto">
                        {expl.evidence}
                        <button type="button" onClick={() => { setExplanations(e => ({ ...e, [p]: { ...e[p], evidence: undefined } })); onEvidenceChange(q.id, ''); }}
                          className="absolute top-0.5 right-1 text-amber-400 hover:text-amber-600 text-[10px]">✕</button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic mt-1">Quét text bên phải → bấm &quot;Gán&quot;</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {distractors.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50/30 overflow-hidden divide-y divide-orange-100">
          <div className="px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50">Heading gây nhiễu</div>
          {distractors.map((d, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white">
              <span className="text-xs text-gray-400 font-medium shrink-0 w-6">{ROMAN[paragraphs.length + i]}</span>
              <Input value={d} onChange={e => { const next = [...distractors]; next[i] = e.target.value; setDistractors(next); }} placeholder="Heading ..." className="text-sm h-8" />
              <button type="button" onClick={() => setDistractors(d => d.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => setDistractors(d => [...d, ''])}>
          <Plus className="h-3 w-3" /> Thêm heading gây nhiễu
        </Button>
        <Button size="sm" onClick={handleSaveAll} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Lưu tất cả
        </Button>
      </div>
    </div>
  );
}
