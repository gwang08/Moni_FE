'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBands, browseCurated } from '@/lib/vocab-api';
import type { BandSummary, CuratedWord } from '@/types/vocab.types';
import { CuratedWordListWithFilters } from './curated-word-list-with-filters';

const BAND_THEME: Record<string, { gradient: string; badge: string; accent: string; ring: string }> = {
  '3-4':     { gradient: 'from-teal-500 to-cyan-500', badge: 'bg-teal-500', accent: 'text-teal-600', ring: 'ring-teal-200' },
  '4-5':     { gradient: 'from-emerald-500 to-green-500', badge: 'bg-emerald-500', accent: 'text-emerald-600', ring: 'ring-emerald-200' },
  '5.5-6.5': { gradient: 'from-blue-500 to-indigo-500', badge: 'bg-blue-500', accent: 'text-blue-600', ring: 'ring-blue-200' },
  '7-8':     { gradient: 'from-violet-500 to-purple-500', badge: 'bg-violet-500', accent: 'text-violet-600', ring: 'ring-violet-200' },
  '8.5-9':   { gradient: 'from-amber-500 to-orange-500', badge: 'bg-amber-500', accent: 'text-amber-600', ring: 'ring-amber-200' },
};

const DEFAULT_THEME = { gradient: 'from-gray-400 to-gray-500', badge: 'bg-gray-500', accent: 'text-gray-600', ring: 'ring-gray-200' };

const POS_BADGE: Record<string, string> = {
  noun: 'bg-blue-500 text-white',
  verb: 'bg-emerald-500 text-white',
  adj: 'bg-amber-500 text-white',
  adv: 'bg-purple-500 text-white',
  adjective: 'bg-amber-500 text-white',
  adverb: 'bg-purple-500 text-white',
};

function WordPreviewRow({ word }: { word: CuratedWord }) {
  const playAudio = () => {
    if (word.audioUrl) new Audio(word.audioUrl).play().catch(() => {});
  };
  const posColor = word.pos ? (POS_BADGE[word.pos.toLowerCase()] ?? 'bg-gray-500 text-white') : '';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0
      hover:bg-gray-50/50 transition-colors px-1 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">{word.word}</span>
          {word.phonetic && (
            <span className="text-xs text-gray-400 font-mono">{word.phonetic}</span>
          )}
          {word.audioUrl && (
            <button
              onClick={playAudio}
              className="text-gray-300 hover:text-indigo-500 transition-colors"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          )}
          {word.pos && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${posColor}`}>
              {word.pos}
            </span>
          )}
        </div>
        {word.meaning && (
          <p className="text-sm text-indigo-600 font-medium mt-0.5 truncate">{word.meaning}</p>
        )}
      </div>
    </div>
  );
}

function BandPreviewSection({ band, onViewAll }: { band: BandSummary; onViewAll: () => void }) {
  const [words, setWords] = useState<CuratedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = BAND_THEME[band.band] ?? DEFAULT_THEME;

  useEffect(() => {
    browseCurated(0, 6, band.band)
      .then(page => setWords(page.content))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [band.band]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm
      hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Colored top bar */}
      <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />

      {/* Band header */}
      <div className="p-5 sm:p-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold px-3.5 py-1.5 rounded-xl text-white ${theme.badge}`}>
              Band {band.band}
            </span>
            <span className="text-sm text-gray-400 font-medium">{band.cefrLevel}</span>
          </div>
          <span className="text-sm text-gray-400 font-medium">
            {band.wordCount.toLocaleString()} từ
          </span>
        </div>
      </div>

      {/* Word previews */}
      <div className="px-5 sm:px-6 pb-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : (
          <div>{words.map(w => <WordPreviewRow key={w.id} word={w} />)}</div>
        )}
      </div>

      {/* View all */}
      <div className="px-5 sm:px-6 pb-5 pt-2">
        <button
          onClick={onViewAll}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl
            text-sm font-semibold ${theme.accent} bg-gray-50 hover:bg-gray-100
            transition-colors`}
        >
          Xem t\u1ea5t c\u1ea3 {band.wordCount.toLocaleString()} t\u1eeb
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface Props {
  selectedBand: string | null;
  onSelectBand: (band: string | null) => void;
}

export function BandBrowseTab({ selectedBand, onSelectBand }: Props) {
  const [bands, setBands] = useState<BandSummary[]>([]);
  const [loadingBands, setLoadingBands] = useState(true);

  useEffect(() => {
    getBands()
      .then(setBands)
      .catch(() => {})
      .finally(() => setLoadingBands(false));
  }, []);

  if (selectedBand) {
    const theme = BAND_THEME[selectedBand] ?? DEFAULT_THEME;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectBand(null)}
            className="gap-1.5 text-gray-500 hover:text-gray-700 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <span className={`text-sm font-bold px-3.5 py-1.5 rounded-xl text-white ${theme.badge}`}>
            Band {selectedBand}
          </span>
        </div>
        <CuratedWordListWithFilters band={selectedBand} />
      </div>
    );
  }

  if (loadingBands) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Từ vựng theo Band IELTS
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Mỗi band hiển thị từ vựng mẫu. Nhấn &ldquo;Xem tất cả&rdquo; để xem đầy đủ.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {bands.map(b => (
          <BandPreviewSection key={b.band} band={b} onViewAll={() => onSelectBand(b.band)} />
        ))}
      </div>
    </div>
  );
}
