'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CuratedWordCard } from './curated-word-card';
import { browseCurated } from '@/lib/vocab-api';
import type { CuratedWord } from '@/types/vocab.types';

const POS_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Noun', value: 'noun' },
  { label: 'Verb', value: 'verb' },
  { label: 'Adjective', value: 'adj' },
  { label: 'Adverb', value: 'adv' },
];

const PAGE_SIZE = 40;

interface Props {
  band?: string;
  topic?: string;
  onPosChange?: (pos: string) => void;
  initialPos?: string;
}

export function CuratedWordListWithFilters({ band, topic, onPosChange, initialPos = '' }: Props) {
  const [pos, setPos] = useState(initialPos);
  const [words, setWords] = useState<CuratedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchWords = useCallback(async (pageNum: number, posFilter: string, append: boolean) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const result = await browseCurated(pageNum, PAGE_SIZE, band, topic, undefined, posFilter || undefined);
      setWords(prev => append ? [...prev, ...result.content] : result.content);
      setTotalElements(result.totalElements);
      setHasMore(!result.last);
      setPage(pageNum);
    } catch {
      if (!append) setWords([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [band, topic]);

  useEffect(() => {
    fetchWords(0, pos, false);
  }, [fetchWords, pos]);

  const handlePosChange = (newPos: string) => {
    setPos(newPos);
    onPosChange?.(newPos);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchWords(page + 1, pos, true);
    }
  };

  return (
    <div className="space-y-4">
      {/* POS filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 mr-1">Từ loại:</span>
        {POS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handlePosChange(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${pos === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {opt.label}
          </button>
        ))}
        {!loading && (
          <span className="ml-auto text-xs text-gray-400">{totalElements.toLocaleString()} từ</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      ) : words.length === 0 ? (
        <p className="text-center text-gray-400 py-12">Không có từ vựng nào</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {words.map(w => <CuratedWordCard key={w.id} word={w} />)}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="gap-2">
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                Xem thêm ({words.length}/{totalElements})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
