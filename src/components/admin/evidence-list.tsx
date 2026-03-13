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
  pendingEvidence?: string | null;
  onAssign?: () => void;
  onChange: (evidence: string | undefined) => void;
}

export function EvidenceList({ evidence, pendingEvidence, onAssign, onChange }: Props) {
  const chunks = parseEvidence(evidence);

  const handleAssign = () => {
    if (!pendingEvidence) return;
    onChange(appendEvidence(evidence, pendingEvidence));
    onAssign?.();
  };

  const handleRemove = (idx: number) => {
    onChange(joinEvidence(chunks.filter((_, i) => i !== idx)));
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
