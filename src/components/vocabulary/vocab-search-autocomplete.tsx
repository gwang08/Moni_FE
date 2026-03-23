'use client';

import { useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import type { CuratedWord } from '@/types/vocab.types';

const POS_BADGE: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-700', verb: 'bg-emerald-100 text-emerald-700',
  adjective: 'bg-amber-100 text-amber-700', adverb: 'bg-purple-100 text-purple-700',
  adj: 'bg-amber-100 text-amber-700', adv: 'bg-purple-100 text-purple-700',
};

interface Props {
  suggestions: CuratedWord[];
  activeIndex: number;
  loading: boolean;
  onSelect: (word: string) => void;
  onHover: (i: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function VocabSearchAutocomplete({
  suggestions, activeIndex, loading, onSelect, onHover, containerRef,
}: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div ref={containerRef}
      className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200
        rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
      {loading && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tìm...
        </div>
      )}
      {suggestions.map((s, i) => (
        <button key={s.id}
          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors
            ${i === activeIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'}
            ${i > 0 ? 'border-t border-gray-50' : ''}`}
          onClick={() => onSelect(s.word)} onMouseEnter={() => onHover(i)}>
          <Search className="h-3.5 w-3.5 text-gray-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{s.word}</span>
              {s.pos && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                  ${POS_BADGE[s.pos.toLowerCase()] ?? 'bg-gray-100 text-gray-600'}`}>
                  {s.pos}
                </span>
              )}
            </div>
            {s.meaning && <p className="text-xs text-gray-500 truncate mt-0.5">{s.meaning}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}
