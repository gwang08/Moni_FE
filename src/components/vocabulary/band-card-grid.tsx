'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Volume2, Loader2 } from 'lucide-react';
import { browseCurated } from '@/lib/vocab-api';
import type { BandSummary, CuratedWord } from '@/types/vocab.types';

const BAND_THEME: Record<string, { gradient: string; accent: string }> = {
  '3-4':     { gradient: 'from-teal-500 to-cyan-600', accent: 'text-teal-600' },
  '4-5':     { gradient: 'from-emerald-500 to-green-600', accent: 'text-emerald-600' },
  '5.5-6.5': { gradient: 'from-blue-500 to-indigo-600', accent: 'text-blue-600' },
  '7-8':     { gradient: 'from-violet-500 to-purple-600', accent: 'text-violet-600' },
  '8.5-9':   { gradient: 'from-amber-500 to-orange-600', accent: 'text-amber-600' },
};

const DEFAULT = { gradient: 'from-gray-500 to-gray-600', accent: 'text-gray-600' };

function BandCard({ band }: { band: BandSummary }) {
  const theme = BAND_THEME[band.band] ?? DEFAULT;
  const [words, setWords] = useState<CuratedWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    browseCurated(0, 4, band.band)
      .then(p => setWords(p.content))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [band.band]);

  const playAudio = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    new Audio(url).play().catch(() => {});
  };

  return (
    <Link
      href={`/vocabulary/band/${band.band}`}
      className="group block rounded-2xl overflow-hidden border border-gray-100 bg-white
        shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${theme.gradient} px-5 py-6 sm:px-6 sm:py-8`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
              {band.cefrLevel}
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Band {band.band}
            </h3>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <BookOpen className="h-4 w-4 text-white/80" />
            <span className="text-sm font-bold text-white">
              {band.wordCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Preview words */}
      <div className="px-5 sm:px-6 py-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="space-y-2.5">
            {words.map(w => (
              <div key={w.id} className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-gray-800 min-w-0 truncate">{w.word}</span>
                {w.phonetic && (
                  <span className="text-[11px] text-gray-400 font-mono shrink-0">{w.phonetic}</span>
                )}
                {w.audioUrl && (
                  <button onClick={e => playAudio(e, w.audioUrl!)}
                    className="shrink-0 text-gray-300 hover:text-indigo-500 transition-colors">
                    <Volume2 className="h-3 w-3" />
                  </button>
                )}
                {w.meaning && (
                  <span className="text-xs text-gray-400 truncate ml-auto">{w.meaning}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className={`mt-4 pt-3 border-t border-gray-100 text-center`}>
          <span className={`text-sm font-bold ${theme.accent}
            group-hover:underline transition-all`}>
            {`B\u1eaft \u0111\u1ea7u h\u1ecdc \u2192`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function BandCardGrid({ bands }: { bands: BandSummary[] }) {
  if (bands.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {bands.map(b => <BandCard key={b.band} band={b} />)}
    </div>
  );
}
