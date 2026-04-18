'use client';

import { useState } from 'react';
import { Info, X, Check, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import type { NormalisedImprovement } from './normalise';

interface HighlightInfo {
  text: string;
  reason: string;
  criterion: string;
  issueType?: string;
  improvedVersion?: string;
}

type Segment = { type: 'text'; content: string } | { type: 'highlight'; content: HighlightInfo };

// Parse essay → segments xen kẽ text thường và đoạn cần sửa (tô highlight)
function parseEssayWithHighlights(essay: string, improvements: NormalisedImprovement[]): { segments: Segment[] } {
  if (!improvements.length) return { segments: [{ type: 'text', content: essay }] };

  const highlights: Array<{ index: number; length: number; info: HighlightInfo }> = [];
  const usedRanges: Array<[number, number]> = [];

  for (const imp of improvements) {
    if (!imp.original_sentence) continue;
    const original = imp.original_sentence.replace(/^"|"$/g, '').trim();
    if (!original) continue;

    let searchIdx = 0;
    while (searchIdx < essay.length) {
      const idx = essay.indexOf(original, searchIdx);
      if (idx === -1) break;

      const overlaps = usedRanges.some(
        ([start, end]) => (idx >= start && idx < end) || (idx + original.length > start && idx + original.length <= end),
      );

      if (!overlaps) {
        highlights.push({
          index: idx,
          length: original.length,
          info: {
            text: original,
            reason: imp.reason || '',
            criterion: imp.criterion,
            issueType: imp.issue_type,
            improvedVersion: imp.improved_sentence?.replace(/^"|"$/g, '').trim(),
          },
        });
        usedRanges.push([idx, idx + original.length]);
        break;
      }
      searchIdx = idx + 1;
    }
  }

  if (!highlights.length) return { segments: [{ type: 'text', content: essay }] };

  highlights.sort((a, b) => a.index - b.index);
  const segments: Segment[] = [];
  let lastIdx = 0;
  for (const hl of highlights) {
    if (hl.index > lastIdx) segments.push({ type: 'text', content: essay.slice(lastIdx, hl.index) });
    segments.push({ type: 'highlight', content: hl.info });
    lastIdx = hl.index + hl.length;
  }
  if (lastIdx < essay.length) segments.push({ type: 'text', content: essay.slice(lastIdx) });
  return { segments };
}

export function ResultHighlightedEssay({
  essay,
  improvements,
}: {
  essay: string;
  improvements: NormalisedImprovement[];
}) {
  const { segments } = parseEssayWithHighlights(essay, improvements);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (!segments.length || (segments.length === 1 && segments[0].type === 'text')) {
    return (
      <div className="rounded-2xl bg-slate-50/80 border border-slate-200 p-6 md:p-8">
        <p className="text-[14px] md:text-[15px] text-slate-800 leading-[1.9] whitespace-pre-wrap font-serif">
          {essay}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-amber-50/80 border-b border-amber-100/60 px-5 py-4 flex items-start sm:items-center gap-3">
        <div className="bg-amber-100/80 p-2 rounded-full shrink-0 shadow-sm border border-amber-200/50">
          <Info className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-[13px] text-amber-800 leading-relaxed font-semibold">
          Các đoạn tô vàng là phần cần cải thiện. Bấm vào biểu tượng{' '}
          <Info className="h-3.5 w-3.5 inline text-amber-600 mx-0.5" /> để xem góp ý chi tiết.
        </p>
      </div>
      <div className="p-6 md:p-8 text-[14px] md:text-[15px] text-slate-800 leading-[2.1] whitespace-pre-wrap font-serif selection:bg-teal-100">
        {segments.map((seg, i) =>
          seg.type === 'text' ? (
            <span key={i} className="text-slate-700">
              {seg.content}
            </span>
          ) : (
            <HighlightSegment
              key={i}
              info={seg.content}
              isOpen={openIdx === i}
              onOpenChange={(o) => setOpenIdx(o ? i : null)}
            />
          ),
        )}
      </div>
    </div>
  );
}

function HighlightSegment({
  info,
  isOpen,
  onOpenChange,
}: {
  info: HighlightInfo;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <span className="inline-flex items-center bg-amber-100/50 border-b-[2px] border-amber-300/80 rounded-[3px] cursor-pointer hover:bg-amber-200/60 transition-colors group relative mx-[1px]">
      <span className="px-1 py-[1.5px] leading-tight">{info.text}</span>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <button className="inline-flex items-center justify-center mx-1 outline-none text-amber-500 group-hover:text-amber-600 group-hover:scale-110 transition-all bg-amber-100 rounded-full w-5 h-5 shadow-sm">
            <Info className="h-3 w-3" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-3xl border border-slate-100 shadow-2xl">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 border border-teal-100/50 hover:bg-teal-100 font-bold tracking-wide px-3">
              {info.criterion}
            </Badge>
            <DialogTrigger asChild>
              <button className="text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 p-1.5 rounded-full transition-all hover:bg-slate-50 focus:ring-2 ring-slate-200 outline-none">
                <X className="h-4 w-4" />
              </button>
            </DialogTrigger>
          </div>
          {info.issueType && (
            <div className="px-6 pt-3">
              <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{info.issueType}</span>
            </div>
          )}
          <div className="p-6 space-y-5 bg-white">
            <div className="relative pl-5">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-full bg-rose-200" />
              <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Vấn đề
              </p>
              <p className="text-[14px] text-slate-700 leading-relaxed font-semibold">{info.reason}</p>
            </div>
            {info.improvedVersion && (
              <div className="relative pl-5 bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100/50">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-emerald-400" />
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Gợi ý cách viết tốt hơn
                </p>
                <p className="text-[14.5px] text-emerald-900 leading-relaxed font-bold">{info.improvedVersion}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </span>
  );
}
