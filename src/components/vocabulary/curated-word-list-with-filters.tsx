'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const POS_ACTIVE_STYLE: Record<string, string> = {
  '': 'bg-indigo-600 text-white shadow-sm',
  noun: 'bg-blue-500 text-white shadow-sm',
  verb: 'bg-emerald-500 text-white shadow-sm',
  adj: 'bg-amber-500 text-white shadow-sm',
  adv: 'bg-purple-500 text-white shadow-sm',
};

const PAGE_SIZE = 40;

interface Props {
  band?: string;
  topic?: string;
  onPosChange?: (pos: string) => void;
  initialPos?: string;
}

export function CuratedWordListWithFilters({ band, topic, onPosChange, initialPos = '' }: Props) {
  const [pos, setPos] = useState(initialPos);
  const [searchQuery, setSearchQuery] = useState('');
  const [words, setWords] = useState<CuratedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchWords = useCallback(async (pageNum: number, posFilter: string, search: string, append: boolean) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const result = await browseCurated(
        pageNum, PAGE_SIZE, band, topic,
        search || undefined,
        posFilter || undefined,
      );
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
    fetchWords(0, pos, searchQuery, false);
  }, [fetchWords, pos, searchQuery]);

  const handlePosChange = (newPos: string) => {
    setPos(newPos);
    onPosChange?.(newPos);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchWords(page + 1, pos, searchQuery, true);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm từ trong danh sách..."
            className="pl-10 h-12 text-base rounded-xl border-gray-200
              focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* POS filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400 font-medium mr-1">Từ loại:</span>
          {POS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handlePosChange(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150
                ${pos === opt.value
                  ? (POS_ACTIVE_STYLE[opt.value] ?? 'bg-indigo-600 text-white shadow-sm')
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-sm text-gray-400">
            Hiển thị {words.length} / {totalElements.toLocaleString()} từ
          </p>
        )}
      </div>

      {/* Word grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-lg text-gray-400 font-medium">
            Không tìm thấy từ vựng nào
          </p>
          <p className="text-sm text-gray-300">
            Thử đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {words.map(w => <CuratedWordCard key={w.id} word={w} />)}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4 pb-2">
              <Button
                variant="outline"
                size="lg"
                onClick={loadMore}
                disabled={loadingMore}
                className="gap-2 px-8 rounded-xl border-gray-200 hover:bg-gray-50"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                Xem thêm ({words.length}/{totalElements.toLocaleString()})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
