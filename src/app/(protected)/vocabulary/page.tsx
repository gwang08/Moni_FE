'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, Bookmark, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { lookupVocab, saveWord, browseCurated, getBands, getTopics, type VocabLookupResult } from '@/lib/vocab-api';
import type { CuratedWord, BandSummary, TopicSummary } from '@/types/vocab.types';
import { toast } from 'sonner';
import { WordResultCard } from '@/components/vocabulary/word-result-card';
import { VocabSearchAutocomplete } from '@/components/vocabulary/vocab-search-autocomplete';
import { VocabLearningMethods } from '@/components/vocabulary/vocab-learning-methods';
import { BandDeckCards } from '@/components/vocabulary/band-deck-cards';
import { TopicDeckCards } from '@/components/vocabulary/topic-deck-cards';
import { VocabWordGrid } from '@/components/vocabulary/vocab-word-grid';
import { ChibiMascot } from '@/components/ui/chibi-mascot';

function VocabularyContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VocabLookupResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [suggestions, setSuggestions] = useState<CuratedWord[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [bands, setBands] = useState<BandSummary[]>([]);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([getBands(), getTopics()])
      .then(([b, t]) => { setBands(b); setTopics(t); })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  // Auto-search if ?q= param is present (e.g. from reading word lookup)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) handleSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setLoadingSuggestions(true);
    try {
      const page = await browseCurated(0, 8, undefined, undefined, q);
      setSuggestions(page.content);
      setShowSuggestions(page.content.length > 0);
    } catch { setSuggestions([]); setShowSuggestions(false); }
    finally { setLoadingSuggestions(false); }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value.trim()), 300);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = async (word?: string) => {
    const q = (word ?? query).trim();
    if (!q) return;
    setQuery(q); setShowSuggestions(false); setLoading(true);
    setError(''); setResult(null); setIsSaved(false);
    try { setResult(await lookupVocab(q)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Không thể tìm từ.'); }
    finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) { if (e.key === 'Enter') handleSearch(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => i < suggestions.length - 1 ? i + 1 : 0); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => i > 0 ? i - 1 : suggestions.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); activeIndex >= 0 ? handleSearch(suggestions[activeIndex].word) : handleSearch(); }
    else if (e.key === 'Escape') setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await saveWord(result.word);
      setIsSaved(true);
      toast.success(`Đã lưu từ "${result.word}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu từ');
    } finally { setSaving(false); }
  };

  const handleClose = () => { setResult(null); setError(''); setQuery(''); setIsSaved(false); };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <ChibiMascot mood="happy" size={56} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Học Từ Vựng IELTS</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Thành thạo từ vựng IELTS với hệ thống lặp lại ngắt quãng của Moni
                </p>
              </div>
            </div>
            <Link href="/vocabulary/notebook"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
              <Bookmark className="h-4 w-4" />
              Từ vựng đã lưu
            </Link>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="border-b border-gray-100 bg-gradient-to-b from-indigo-50/40 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="max-w-2xl mx-auto relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                <Input ref={inputRef} placeholder="Nhập từ tiếng Anh cần tra..."
                  className="pl-12 h-12 text-base rounded-xl border-gray-200 bg-white shadow-sm
                    focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  value={query} onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off" />
              </div>
              <Button onClick={() => handleSearch()} disabled={loading || !query.trim()}
                className="h-12 px-6 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tra từ'}
              </Button>
            </div>

            {showSuggestions && (
              <VocabSearchAutocomplete
                suggestions={suggestions}
                activeIndex={activeIndex}
                loading={loadingSuggestions}
                onSelect={handleSearch}
                onHover={setActiveIndex}
                containerRef={suggestionsRef}
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-sm text-gray-400">Đang tra từ điển...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="max-w-2xl mx-auto rounded-xl bg-red-50 border border-red-100 p-5
            flex items-center justify-between">
            <p className="text-red-600 text-sm font-medium">{error}</p>
            <button onClick={handleClose} className="text-red-400 hover:text-red-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Rich result card */}
        {!loading && result && (
          <div className="space-y-3">
            <div className="flex justify-end max-w-2xl mx-auto">
              <button onClick={handleClose}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600
                  transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
                <X className="h-3.5 w-3.5" /> Đóng kết quả
              </button>
            </div>
            <WordResultCard result={result} saving={saving} isSaved={isSaved} onSave={handleSave} />
          </div>
        )}

        {/* Browse sections — hidden while showing result */}
        {!result && !loading && (
          <>
            <VocabLearningMethods />

            <VocabWordGrid onWordClick={handleSearch} />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                Từ Vựng Theo Band IELTS
                {bands.length > 0 && <span className="text-sm font-normal text-gray-400 ml-2">({bands.length} bộ thẻ)</span>}
              </h2>
              <div className="h-px bg-gray-100 mb-5" />
              {loadingData
                ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
                : <BandDeckCards bands={bands} />}
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                Từ Vựng Theo Chủ Đề
                {topics.length > 0 && <span className="text-sm font-normal text-gray-400 ml-2">({topics.length} bộ thẻ)</span>}
              </h2>
              <div className="h-px bg-gray-100 mb-5" />
              {loadingData
                ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
                : <TopicDeckCards topics={topics} />}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function VocabularyPage() {
  return (<Suspense><VocabularyContent /></Suspense>);
}
