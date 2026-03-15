'use client';

import { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, Loader2 } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import { Button } from '@/components/ui/button';
import { getBands } from '@/lib/vocab-api';
import type { BandSummary } from '@/types/vocab.types';
import { CuratedWordListWithFilters } from './curated-word-list-with-filters';

const BAND_COLORS: Record<string, string> = {
  '3-4': 'from-teal-50 to-cyan-100 border-teal-200',
  '4-5': 'from-green-50 to-emerald-100 border-green-200',
  '5.5-6.5': 'from-blue-50 to-sky-100 border-blue-200',
  '7-8': 'from-violet-50 to-purple-100 border-violet-200',
  '8.5-9': 'from-amber-50 to-orange-100 border-amber-200',
};

const BAND_BADGE_COLORS: Record<string, string> = {
  '3-4': 'bg-teal-100 text-teal-800',
  '4-5': 'bg-emerald-100 text-emerald-800',
  '5.5-6.5': 'bg-blue-100 text-blue-800',
  '7-8': 'bg-violet-100 text-violet-800',
  '8.5-9': 'bg-amber-100 text-amber-800',
};

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
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onSelectBand(null)} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <span className="font-semibold text-gray-800">Band {selectedBand}</span>
        </div>
        <CuratedWordListWithFilters band={selectedBand} />
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
              onClick={() => onSelectBand(b.band)}
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
