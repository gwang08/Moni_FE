'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { browseCurated } from '@/lib/vocab-api';
import type { CuratedWord } from '@/types/vocab.types';

const BAND_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Band 4', value: '4' },
  { label: 'Band 5', value: '5' },
  { label: 'Band 6', value: '6' },
  { label: 'Band 7', value: '7' },
  { label: 'Band 8', value: '8' },
];

const POS_BADGE: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-700',
  verb: 'bg-emerald-100 text-emerald-700',
  adj: 'bg-amber-100 text-amber-700',
  adjective: 'bg-amber-100 text-amber-700',
  adv: 'bg-purple-100 text-purple-700',
  adverb: 'bg-purple-100 text-purple-700',
};

interface Props {
  onWordClick: (word: string) => void;
}

function CompactWordCard({ word, onClick }: { word: CuratedWord; onClick: () => void }) {
  const posColor = word.pos
    ? (POS_BADGE[word.pos.toLowerCase()] ?? 'bg-gray-100 text-gray-600')
    : '';

  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-xl border border-gray-100 bg-white p-3.5
        hover:border-indigo-200 hover:shadow-sm hover:bg-indigo-50/30 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <span className="font-bold text-gray-900 text-base leading-tight truncate">
          {word.word}
        </span>
        {word.pos && (
          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${posColor}`}>
            {word.pos}
          </span>
        )}
      </div>
      {word.phonetic && (
        <p className="text-xs text-indigo-400 font-mono mt-0.5">{word.phonetic}</p>
      )}
      {word.meaning && (
        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{word.meaning}</p>
      )}
      {word.band && (
        <p className="text-[11px] text-gray-400 mt-1">Band {word.band}</p>
      )}
    </button>
  );
}

export function VocabWordGrid({ onWordClick }: Props) {
  const [activeBand, setActiveBand] = useState('');
  const [words, setWords] = useState<CuratedWord[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchWords = useCallback(async (pageNum: number, band: string, append: boolean) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const result = await browseCurated(pageNum, 20, band || undefined);
      setWords(prev => append ? [...prev, ...result.content] : result.content);
      setHasMore(!result.last);
      setPage(pageNum);
    } catch {
      if (!append) setWords([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Reset and fetch when band tab changes
  useEffect(() => {
    fetchWords(0, activeBand, false);
  }, [fetchWords, activeBand]);

  const handleBandChange = (band: string) => {
    if (band === activeBand) return;
    setActiveBand(band);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchWords(page + 1, activeBand, true);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Từ điển IELTS</h2>
      </div>
      <div className="h-px bg-gray-100 mb-4" />

      {/* Band filter tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {BAND_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleBandChange(tab.value)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeBand === tab.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Word grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
        </div>
      ) : words.length === 0 ? (
        <p className="text-center py-12 text-gray-400 text-sm">Không có từ nào.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {words.map(w => (
              <CompactWordCard key={w.id} word={w} onClick={() => onWordClick(w.word)} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-5">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="gap-2 px-6 rounded-xl border-gray-200 hover:bg-gray-50 text-sm"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                Xem thêm
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
