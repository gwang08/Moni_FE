'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, Bookmark, BookOpen, Layers, Tag, X, BookMarked } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { lookupVocab, saveWord, browseCurated, getBands, getTopics, getDueReview, type VocabLookupResult } from '@/lib/vocab-api';
import type { CuratedWord, BandSummary, TopicSummary } from '@/types/vocab.types';
import { toast } from 'sonner';
import { WordResultCard } from '@/components/vocabulary/word-result-card';
import { VocabSearchAutocomplete } from '@/components/vocabulary/vocab-search-autocomplete';
import { BandDeckCards } from '@/components/vocabulary/band-deck-cards';
import { TopicDeckCards } from '@/components/vocabulary/topic-deck-cards';
import { ChibiMascot } from '@/components/ui/chibi-mascot';

type BrowseTab = 'dict' | 'band' | 'topic';

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
  const [dueCount, setDueCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  const [browseTab, setBrowseTab] = useState<BrowseTab>('dict');
  const [dictWords, setDictWords] = useState<CuratedWord[]>([]);
  const [dictPage, setDictPage] = useState(0);
  const [dictLoading, setDictLoading] = useState(false);
  const [dictTotal, setDictTotal] = useState(0);
  const DICT_SIZE = 20;

  useEffect(() => {
    Promise.all([getBands(), getTopics(), getDueReview()])
      .then(([b, t, due]) => {
        setBands(b);
        setTopics(t);
        setDueCount(due.length);
      })
      .catch(() => { })
      .finally(() => setLoadingData(false));
  }, []);

  // Load curated words for dict tab
  useEffect(() => {
    if (browseTab === 'dict') {
      setDictLoading(true);
      browseCurated(0, DICT_SIZE)
        .then(page => {
          setDictWords(page.content);
          setDictTotal(page.totalElements);
          setDictPage(0);
        })
        .catch(() => { })
        .finally(() => setDictLoading(false));
    }
  }, [browseTab]);

  const loadMoreDictWords = () => {
    const nextPage = dictPage + 1;
    setDictLoading(true);
    browseCurated(nextPage, DICT_SIZE)
      .then(page => {
        setDictWords(prev => [...prev, ...page.content]);
        setDictPage(nextPage);
      })
      .catch(() => { })
      .finally(() => setDictLoading(false));
  };

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

  const TABS: { key: BrowseTab; label: string; icon: React.ReactNode }[] = [
    { key: 'dict', label: 'Từ điển', icon: <BookOpen className="h-4 w-4" /> },
    { key: 'band', label: 'Theo Band', icon: <Layers className="h-4 w-4" /> },
    { key: 'topic', label: 'Theo Chủ đề', icon: <Tag className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <ChibiMascot mood="happy" size={48} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Học Từ Vựng IELTS</h1>
                <p className="text-sm text-gray-500">
                  Thành thạo từ vựng với hệ thống lặp lại ngắt quãng
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Quick stats */}
              {dueCount > 0 && (
                <Link href="/vocabulary/review">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 gap-1.5 px-3 py-1.5">
                    <BookMarked className="h-3.5 w-3.5" />
                    {dueCount} từ cần ôn
                  </Badge>
                </Link>
              )}
              <Link href="/vocabulary/notebook">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Bookmark className="h-4 w-4" />
                  Sổ từ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="max-w-2xl mx-auto relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                <Input ref={inputRef} placeholder="Tra từ tiếng Anh..."
                  className="pl-12 h-11 text-base rounded-xl border-gray-200 bg-gray-50
                    focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
                  value={query} onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off" />
              </div>
              <Button onClick={() => handleSearch()} disabled={loading || !query.trim()}
                className="h-11 px-6 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-700 shadow-sm">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Search result */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-sm text-gray-400">Đang tra từ điển...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex items-center justify-between mb-6">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={handleClose} className="text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {!loading && result && (
          <div className="mb-8">
            <div className="flex justify-end mb-3">
              <button onClick={handleClose}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600
                  px-2 py-1 rounded-lg hover:bg-gray-100">
                <X className="h-3.5 w-3.5" /> Đóng
              </button>
            </div>
            <WordResultCard result={result} saving={saving} isSaved={isSaved} onSave={handleSave} />
          </div>
        )}

        {/* Browse content */}
        {!result && !loading && (
          <>
            {/* Quick actions row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <Link href="/vocabulary/review"
                className="group rounded-xl border border-amber-200 bg-amber-50/50 p-4
                  hover:shadow-md hover:border-amber-300 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center
                    group-hover:bg-amber-200 transition-colors">
                    <BookMarked className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Ôn tập</p>
                    <p className="text-xs text-gray-500">
                      {dueCount > 0 ? `${dueCount} từ cần ôn` : 'Spaced Repetition'}
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/vocabulary/flashcard"
                className="group rounded-xl border border-blue-200 bg-blue-50/50 p-4
                  hover:shadow-md hover:border-blue-300 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center
                    group-hover:bg-blue-200 transition-colors">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Flashcard</p>
                    <p className="text-xs text-gray-500">Thẻ lật ôn tập</p>
                  </div>
                </div>
              </Link>

              <Link href="/vocabulary/quiz"
                className="group rounded-xl border border-emerald-200 bg-emerald-50/50 p-4
                  hover:shadow-md hover:border-emerald-300 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center
                    group-hover:bg-emerald-200 transition-colors">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Trắc nghiệm</p>
                    <p className="text-xs text-gray-500">Kiểm tra kiến thức</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Browse tabs */}
            <div className="bg-white rounded-2xl border shadow-sm">
              {/* Tab headers */}
              <div className="flex border-b px-4 sm:px-6">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setBrowseTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2
                      transition-colors -mb-px
                      ${browseTab === tab.key
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-4 sm:p-6">
                {browseTab === 'dict' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-semibold text-gray-900">Từ điển IELTS</h2>
                      <span className="text-xs text-gray-400">{dictTotal} từ</span>
                    </div>
                    {dictLoading && dictWords.length === 0 ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dictWords.map(w => (
                            <button
                              key={w.id}
                              onClick={() => handleSearch(w.word)}
                              className="text-left p-3 rounded-lg border border-gray-100 hover:border-indigo-200
                                hover:bg-indigo-50/50 transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 text-sm group-hover:text-indigo-700">
                                  {w.word}
                                </span>
                                {w.pos && (
                                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded
                                    bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                                    {w.pos}
                                  </span>
                                )}
                              </div>
                              {w.band && (
                                <p className="text-[11px] text-gray-400 mt-1">{w.band}</p>
                              )}
                            </button>
                          ))}
                        </div>
                        {dictWords.length < dictTotal && (
                          <div className="flex justify-center mt-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={loadMoreDictWords}
                              disabled={dictLoading}
                              className="gap-1.5"
                            >
                              {dictLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Xem thêm'}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {browseTab === 'band' && (
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Từ Vựng Theo Band IELTS</h2>
                    {loadingData ? (
                      <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
                    ) : (
                      <BandDeckCards bands={bands} />
                    )}
                  </div>
                )}

                {browseTab === 'topic' && (
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Từ Vựng Theo Chủ Đề</h2>
                    {loadingData ? (
                      <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
                    ) : (
                      <TopicDeckCards topics={topics} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VocabularyPage() {
  return (<Suspense><VocabularyContent /></Suspense>);
}
