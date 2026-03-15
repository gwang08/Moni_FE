'use client';

import { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, Loader2, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBands, browseCurated } from '@/lib/vocab-api';
import type { BandSummary, CuratedWord } from '@/types/vocab.types';

// Band color map for visual distinction
const BAND_COLORS: Record<string, string> = {
  '4-5': 'from-green-50 to-emerald-100 border-green-200',
  '5.5-6.5': 'from-blue-50 to-sky-100 border-blue-200',
  '7-8': 'from-violet-50 to-purple-100 border-violet-200',
  '8.5-9': 'from-amber-50 to-orange-100 border-amber-200',
};

const BAND_BADGE_COLORS: Record<string, string> = {
  '4-5': 'bg-emerald-100 text-emerald-800',
  '5.5-6.5': 'bg-blue-100 text-blue-800',
  '7-8': 'bg-violet-100 text-violet-800',
  '8.5-9': 'bg-amber-100 text-amber-800',
};

function CuratedWordCard({ word }: { word: CuratedWord }) {
  const playAudio = () => {
    if (word.audioUrl) new Audio(word.audioUrl).play().catch(() => {});
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{word.word}</p>
            {word.audioUrl && (
              <button onClick={playAudio} className="text-gray-400 hover:text-blue-500" title="Nghe phát âm">
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {word.phonetic && <p className="text-xs text-gray-400">{word.phonetic}</p>}
        </div>
        {word.pos && (
          <Badge variant="outline" className="text-xs shrink-0">{word.pos}</Badge>
        )}
      </div>
      {word.meaning && <p className="text-sm text-blue-600 font-medium">{word.meaning}</p>}
      {word.definition && <p className="text-xs text-gray-600 line-clamp-2">{word.definition}</p>}
    </div>
  );
}

export function BandBrowseTab() {
  const [bands, setBands] = useState<BandSummary[]>([]);
  const [loadingBands, setLoadingBands] = useState(true);
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [words, setWords] = useState<CuratedWord[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);

  useEffect(() => {
    getBands()
      .then(setBands)
      .catch(() => {})
      .finally(() => setLoadingBands(false));
  }, []);

  const handleSelectBand = async (band: string) => {
    setSelectedBand(band);
    setLoadingWords(true);
    setWords([]);
    try {
      const page = await browseCurated(0, 50, band);
      setWords(page.content);
    } catch {
      setWords([]);
    } finally {
      setLoadingWords(false);
    }
  };

  if (selectedBand) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedBand(null)} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <span className="font-semibold text-gray-800">Band {selectedBand}</span>
          {!loadingWords && (
            <Badge variant="secondary" className="ml-auto">{words.length} từ</Badge>
          )}
        </div>

        {loadingWords ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : words.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Không có từ vựng nào</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {words.map((w) => <CuratedWordCard key={w.id} word={w} />)}
          </div>
        )}
      </div>
    );
  }

  if (loadingBands) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Chọn band IELTS để xem từ vựng tương ứng</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bands.map((b) => {
          const gradientClass = BAND_COLORS[b.band] ?? 'from-gray-50 to-gray-100 border-gray-200';
          const badgeClass = BAND_BADGE_COLORS[b.band] ?? 'bg-gray-100 text-gray-800';
          return (
            <button
              key={b.band}
              onClick={() => handleSelectBand(b.band)}
              className={`rounded-xl border bg-gradient-to-br ${gradientClass} p-5 text-left
                hover:shadow-md transition-all duration-200 cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                  Band {b.band}
                </span>
                <span className="text-xs text-gray-500">{b.cefrLevel}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm font-medium">{b.wordCount.toLocaleString()} từ</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
