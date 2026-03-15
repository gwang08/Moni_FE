'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { EvidenceList, appendEvidence } from '@/components/admin/evidence-list';
import type { QuestionRequest } from '@/types/admin.types';

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];

/** Extract paragraph labels (A, B, C...) from passage HTML */
export function detectParagraphs(html: string): string[] {
  if (!html) return [];
  const text = html.replace(/<[^>]+>/g, '\n');
  const labels = new Set<string>();
  // 1. Try explicit "Paragraph A" labels
  for (const m of text.matchAll(/Paragraph\s+([A-Z])\b/gi)) labels.add(m[1].toUpperCase());
  // 2. Try "A." pattern at line start
  if (labels.size === 0) {
    for (const m of text.matchAll(/(?:^|\n)\s*([A-Z])\.\s/g)) labels.add(m[1].toUpperCase());
  }
  if (labels.size > 0) return [...labels].sort();

  // 3. Fallback: auto-detect by <p> tags, skip short paragraphs (<50 chars)
  const pParts = html.split(/<p[^>]*>/i).filter(p => {
    const plain = p.replace(/<[^>]*>/g, '').trim();
    return plain.length >= 50;
  });
  if (pParts.length > 1) {
    return pParts.map((_, i) => String.fromCharCode(65 + i));
  }
  return [];
}

interface Props {
  paragraphs: string[];
  questions: QuestionRequest[];
  pendingEvidence: string | null;
  onAssignEvidence: (qi: number) => void;
  onChange: (questions: QuestionRequest[], sharedOptions: { label: string; content: string }[]) => void;
}

export function MatchingHeadingsEditor({ paragraphs, questions, pendingEvidence, onAssignEvidence, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Extract distractors from existing sharedOptions (headings beyond paragraph count)
  const existingDistractors = (() => {
    // Find existing distractor headings from questions' options that don't map to any paragraph
    const paraLabels = new Set(paragraphs.map((_, i) => ROMAN[i]));
    const seen = new Set<string>();
    for (const q of questions) {
      for (const o of q.options) {
        if (o.label && !paraLabels.has(o.label) && !seen.has(o.label)) seen.add(o.label);
      }
    }
    // Get content from first question's options (all questions share same options)
    const firstQ = questions[0];
    if (!firstQ) return [] as string[];
    return [...seen].map(label => firstQ.options.find(o => o.label === label)?.content || '');
  })();

  const [distractors, setDistractors] = useState<string[]>(existingDistractors);

  const headingMap: Record<string, string> = {};
  const explanationMap: Record<string, QuestionRequest['explanation']> = {};
  for (const q of questions) {
    const correctOpt = q.options.find(o => o.isCorrect);
    if (correctOpt) headingMap[q.content] = correctOpt.content;
    if (q.explanation) explanationMap[q.content] = q.explanation;
  }

  const rebuild = (heads: Record<string, string>, expls: Record<string, QuestionRequest['explanation']>, dists: string[]) => {
    // All headings: paragraphs + distractors
    const allHeadings: { label: string; content: string }[] = [];
    paragraphs.forEach((p, i) => {
      const content = heads[`Paragraph ${p}`] || '';
      if (content.trim()) allHeadings.push({ label: ROMAN[i] || String(i + 1), content });
    });
    const nextIdx = paragraphs.length;
    dists.forEach((d, i) => {
      if (d.trim()) allHeadings.push({ label: ROMAN[nextIdx + i] || String(nextIdx + i + 1), content: d });
    });

    const newQuestions: QuestionRequest[] = paragraphs.map((p, i) => {
      const myHeading = heads[`Paragraph ${p}`] || '';
      const myLabel = ROMAN[i] || String(i + 1);
      const options = allHeadings.length > 0
        ? allHeadings.map(h => ({ label: h.label, content: h.content, isCorrect: h.label === myLabel && myHeading.trim() !== '' }))
        : [];
      return { content: `Paragraph ${p}`, options, explanation: expls[`Paragraph ${p}`] };
    });
    onChange(newQuestions, allHeadings);
  };

  const onHeading = (p: string, v: string) => rebuild({ ...headingMap, [`Paragraph ${p}`]: v }, explanationMap, distractors);
  const onExpl = (p: string, v: string) => {
    const k = `Paragraph ${p}`;
    rebuild(headingMap, { ...explanationMap, [k]: { ...explanationMap[k], text: v || undefined } }, distractors);
  };
  const onEvidenceChange = (p: string, qi: number, ev: string | undefined) => {
    const k = `Paragraph ${p}`;
    rebuild(headingMap, { ...explanationMap, [k]: { ...explanationMap[k], evidence: ev } }, distractors);
  };

  const addDistractor = () => {
    const next = [...distractors, ''];
    setDistractors(next);
    rebuild(headingMap, explanationMap, next);
  };
  const updateDistractor = (idx: number, v: string) => {
    const next = distractors.map((d, i) => (i === idx ? v : d));
    setDistractors(next);
    rebuild(headingMap, explanationMap, next);
  };
  const removeDistractor = (idx: number) => {
    const next = distractors.filter((_, i) => i !== idx);
    setDistractors(next);
    rebuild(headingMap, explanationMap, next);
  };

  if (paragraphs.length === 0) {
    return (
      <div className="border-2 border-dashed border-amber-200 rounded-lg p-4 text-center">
        <p className="text-xs text-amber-600">Không tìm thấy đoạn văn (Paragraph A, B, C...) trong bài đọc.</p>
        <p className="text-xs text-gray-400 mt-1">Quay lại bước 2, đánh dấu bằng &quot;Paragraph A&quot;, &quot;Paragraph B&quot;...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Paragraph → Heading table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
        <div className="grid grid-cols-[36px_1fr_28px] bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
          <span>Para</span>
          <span>Heading</span>
          <span />
        </div>

        {paragraphs.map((p, i) => {
          const key = `Paragraph ${p}`;
          const heading = headingMap[key] || '';
          const expl = explanationMap[key];
          const isOpen = expanded === p;
          const hasDetail = !!(expl?.text || expl?.evidence);

          return (
            <div key={p} className="bg-white">
              <div className="grid grid-cols-[36px_1fr_28px] items-center px-3 py-2 gap-1">
                <span className="text-sm font-bold text-blue-600">{p}</span>
                <Input value={heading} onChange={e => onHeading(p, e.target.value)} placeholder="Nội dung heading..." className="text-sm h-8" />
                <button
                  type="button" onClick={() => setExpanded(isOpen ? null : p)}
                  className={`flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 ${hasDetail ? 'text-amber-500' : 'text-gray-300'}`}
                  title="Giải thích & dẫn chứng"
                >
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {isOpen && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-2 ml-[36px] mr-[28px] border-t border-dashed border-gray-100">
                  <div className="pt-2">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Giải thích</span>
                    <textarea
                      value={expl?.text ?? ''} onChange={e => onExpl(p, e.target.value)}
                      placeholder="Tại sao heading này đúng?" rows={2}
                      className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="pt-2">
                    <EvidenceList
                      evidence={expl?.evidence}
                      pendingEvidence={pendingEvidence}
                      onAssign={() => onAssignEvidence(i)}
                      onChange={ev => onEvidenceChange(p, i, ev)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Distractor headings */}
      {distractors.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50/30 overflow-hidden divide-y divide-orange-100">
          <div className="px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50">
            Heading  (không gắn paragraph)
          </div>
          {distractors.map((d, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white">
              <span className="text-xs text-gray-400 font-medium shrink-0 w-6">{ROMAN[paragraphs.length + i]}</span>
              <Input value={d} onChange={e => updateDistractor(i, e.target.value)} placeholder="Heading ..." className="text-sm h-8" />
              <button type="button" onClick={() => removeDistractor(i)} className="text-gray-300 hover:text-red-500 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={addDistractor}>
        <Plus className="h-3 w-3" /> Thêm heading 
      </Button>
    </div>
  );
}
