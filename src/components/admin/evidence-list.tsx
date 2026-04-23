'use client';

import { Button } from '@/components/ui/button';
import { Highlighter } from 'lucide-react';

const SEPARATOR = '\n---\n';

/** Split stored evidence string into individual chunks */
export function parseEvidence(evidence?: string): string[] {
  if (!evidence) return [];
  return evidence.split(SEPARATOR).filter(e => e.trim());
}

/** Join multiple evidence chunks into a single string */
export function joinEvidence(chunks: string[]): string | undefined {
  const filtered = chunks.filter(e => e.trim());
  return filtered.length > 0 ? filtered.join(SEPARATOR) : undefined;
}

/** Append a new evidence chunk to existing evidence string */
export function appendEvidence(existing: string | undefined, newChunk: string): string {
  const chunks = parseEvidence(existing);
  chunks.push(newChunk);
  return chunks.join(SEPARATOR);
}

interface Props {
  evidence?: string;
  offsets?: number[];
  startOffsets?: number[];
  endOffsets?: number[];
  startTimes?: number[];
  pendingEvidence?: string | null;
  pendingOffset?: number;
  pendingStartOffset?: number;
  pendingEndOffset?: number;
  pendingStartTime?: number | null;
  onAssign?: () => void;
  onChange: (
    evidence: string | undefined,
    offsets: number[] | undefined,
    startOffsets?: number[],
    endOffsets?: number[],
    startTimes?: number[]
  ) => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function EvidenceList({
  evidence,
  offsets,
  startOffsets,
  endOffsets,
  startTimes,
  pendingEvidence,
  pendingOffset,
  pendingStartOffset,
  pendingEndOffset,
  pendingStartTime,
  onAssign,
  onChange,
}: Props) {
  const chunks = parseEvidence(evidence);
  const currentOffsets = offsets || [];
  const currentStartOffsets = startOffsets || [];
  const currentEndOffsets = endOffsets || [];
  const currentStartTimes = startTimes || [];

  const handleAssign = () => {
    if (!pendingEvidence) return;
    const nextChunks = [...chunks, pendingEvidence];
    const nextOffsets = [...currentOffsets.slice(0, chunks.length), pendingOffset ?? -1];
    const nextStartOffsets = [...currentStartOffsets.slice(0, chunks.length), pendingStartOffset ?? -1];
    const nextEndOffsets = [...currentEndOffsets.slice(0, chunks.length), pendingEndOffset ?? -1];
    const nextStartTimes = [...currentStartTimes.slice(0, chunks.length), pendingStartTime ?? -1];

    onChange(joinEvidence(nextChunks), nextOffsets, nextStartOffsets, nextEndOffsets, nextStartTimes);
    onAssign?.();
  };

  const handleRemove = (idx: number) => {
    const nextChunks = chunks.filter((_, i) => i !== idx);
    const nextOffsets = currentOffsets.filter((_, i) => i !== idx);
    const nextStartOffsets = currentStartOffsets.filter((_, i) => i !== idx);
    const nextEndOffsets = currentEndOffsets.filter((_, i) => i !== idx);
    const nextStartTimes = currentStartTimes.filter((_, i) => i !== idx);

    onChange(
      joinEvidence(nextChunks),
      nextOffsets.length > 0 ? nextOffsets : undefined,
      nextStartOffsets,
      nextEndOffsets,
      nextStartTimes
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Dẫn chứng</span>
        {pendingEvidence && onAssign && (
          <Button type="button" size="sm" variant="default" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={handleAssign}>
            <Highlighter className="h-2.5 w-2.5" /> {chunks.length > 0 ? 'Thêm dẫn chứng' : 'Gán'}
          </Button>
        )}
      </div>

      {chunks.length > 0 ? (
        <div className="space-y-1">
          {chunks.map((chunk, i) => (
            <div key={i} className="relative rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900 whitespace-pre-wrap max-h-14 overflow-y-auto pr-5">
              {chunk}
              <div className="mt-0.5 flex flex-wrap gap-1 opacity-70">
                {currentStartOffsets[i] !== undefined && currentStartOffsets[i] !== -1 && (
                  <span className="text-[9px] text-amber-700 bg-amber-100/50 px-1 rounded">Pos: {currentStartOffsets[i]}-{currentEndOffsets[i]}</span>
                )}
                {currentStartTimes[i] !== undefined && currentStartTimes[i] !== -1 && (
                  <span className="text-[9px] text-amber-700 bg-amber-100/50 px-1 rounded">Audio: {formatTime(currentStartTimes[i])}</span>
                )}
                {/* Fallback for legacy data */}
                {(!currentStartOffsets[i] || currentStartOffsets[i] === -1) && currentOffsets[i] !== undefined && currentOffsets[i] !== -1 && (
                  <span className="text-[9px] text-amber-700 bg-amber-100/50 px-1 rounded">Index: {currentOffsets[i]}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-0.5 right-1 text-amber-400 hover:text-amber-600 text-[10px]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-gray-400 italic pt-0.5">Quét text → bấm &quot;Gán&quot;</p>
      )}
    </div>
  );
}
