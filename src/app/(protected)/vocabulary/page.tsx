'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, Loader2, Bookmark,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchWord, saveWord, browseCurated, getBands, getTopics } from '@/lib/vocab-api';
import type { VocabSearchResult, CuratedWord, BandSummary, TopicSummary } from '@/types/vocab.types';
import { toast } from 'sonner';
import { SearchResultCard } from '@/components/vocabulary/search-result-card';
import { BandDeckCards } from '@/components/vocabulary/band-deck-cards';
import { TopicDeckCards } from '@/components/vocabulary/topic-deck-cards';
import { ChibiMascot } from '@/components/ui/chibi-mascot';

const T = {
  title: 'H\u1ecdc T\u1eeb V\u1ef1ng IELTS',
  subtitle: 'Th\u00e0nh th\u1ea1o t\u1eeb v\u1ef1ng IELTS v\u1edbi h\u1ec7 th\u1ed1ng l\u1eb7p l\u1ea1i ng\u1eaft qu\u00e3ng c\u1ee7a Moni',
  saved_btn: 'T\u1eeb v\u1ef1ng \u0111\u00e3 l\u01b0u',
  search_placeholder: 'T\u00ecm ki\u1ebfm t\u1eeb v\u1ef1ng...',
  search_btn: 'Tra t\u1eeb',
  searching: '\u0110ang t\u00ecm...',
  search_error: 'Kh\u00f4ng th\u1ec3 t\u00ecm t\u1eeb.',
  by_band: 'T\u1eeb V\u1ef1ng Theo Band IELTS',
  by_topic: 'T\u1eeb V\u1ef1ng Theo Ch\u1ee7 \u0110\u1ec1',
  learning: 'Ph\u01b0\u01a1ng Ph\u00e1p H\u1ecdc',
  deck_unit: 'b\u1ed9 th\u1ebb',
};

const POS_BADGE: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-700', verb: 'bg-emerald-100 text-emerald-700',
  adjective: 'bg-amber-100 text-amber-700', adverb: 'bg-purple-100 text-purple-700',
  adj: 'bg-amber-100 text-amber-700', adv: 'bg-purple-100 text-purple-700',
};

function VocabularyContent() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VocabSearchResult | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
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
    setQuery(q); setShowSuggestions(false); setLoading(true); setError(''); setResult(null);
    try { setResult(await searchWord(q)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : T.search_error); }
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
      toast.success(`\u0110\u00e3 l\u01b0u t\u1eeb "${result.word}"`);
      setResult(prev => prev ? { ...prev, isSaved: true } : prev);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - like Parroto */}
      <div className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <ChibiMascot mood="happy" size={56} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{T.title}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{T.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/vocabulary/notebook"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                <Bookmark className="h-4 w-4" />
                {T.saved_btn}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="max-w-xl relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Input ref={inputRef} placeholder={T.search_placeholder}
                  className="pl-10 h-10 text-sm rounded-lg border-gray-200 bg-gray-50
                    focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 focus:bg-white"
                  value={query} onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off" />
              </div>
              <Button onClick={() => handleSearch()} disabled={loading || !query.trim()}
                className="h-10 px-5 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : T.search_btn}
              </Button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestionsRef}
                className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200
                  rounded-lg shadow-lg overflow-hidden max-h-72 overflow-y-auto">
                {loadingSuggestions && (
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> {T.searching}
                  </div>
                )}
                {suggestions.map((s, i) => (
                  <button key={s.id}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors
                      ${i === activeIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'}
                      ${i > 0 ? 'border-t border-gray-50' : ''}`}
                    onClick={() => handleSearch(s.word)} onMouseEnter={() => setActiveIndex(i)}>
                    <Search className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{s.word}</span>
                        {s.pos && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                          ${POS_BADGE[s.pos.toLowerCase()] ?? 'bg-gray-100 text-gray-600'}`}>{s.pos}</span>}
                      </div>
                      {s.meaning && <p className="text-xs text-gray-500 truncate mt-0.5">{s.meaning}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10">
        {/* Learning Methods - right below hero */}
        <section>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
            {T.learning}
          </h2>
          <div className="h-px bg-gray-100 mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { href: '/vocabulary/flashcard', label: 'Flashcard',
                desc: '\u00d4n t\u1eadp v\u1edbi th\u1ebb l\u1eadt v\u00e0 Spaced Repetition',
                img: '/vocab/method-flashcard.jpg' },
              { href: '/vocabulary/quiz', label: 'Tr\u1eafc Nghi\u1ec7m',
                desc: 'Ki\u1ec3m tra ki\u1ebfn th\u1ee9c v\u1edbi c\u00e2u h\u1ecfi tr\u1eafc nghi\u1ec7m',
                img: '/vocab/method-quiz.jpg' },
              { href: '/vocabulary/word-match', label: 'N\u1ed1i T\u1eeb',
                desc: 'Gh\u00e9p t\u1eeb v\u1edbi ngh\u0129a t\u01b0\u01a1ng \u1ee9ng',
                img: '/vocab/method-match.jpg' },
            ].map(m => (
              <Link key={m.href} href={m.href}
                className="group block rounded-lg border border-gray-200 bg-white
                  hover:shadow-lg transition-all duration-300">
                <div className="p-4">
                  <div className="w-full h-44 mb-3 rounded-lg overflow-hidden bg-gray-100 relative">
                    <Image src={m.img} alt={m.label} fill
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="mb-3">
                    <p className="font-semibold text-[16px] leading-[20px] line-clamp-2">{m.label}</p>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    <p>{m.desc}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center justify-center whitespace-nowrap
                      text-sm font-medium bg-primary text-primary-foreground shadow-xs
                      hover:bg-primary/80 transition-all rounded-md flex-1 h-10">
                      {`B\u1eaft \u0111\u1ea7u H\u1ecdc`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Search result overlay */}
        {(loading || error || result) && (
          <div>
            {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>}
            {error && <div className="max-w-2xl rounded-lg bg-red-50 border border-red-200 p-4 text-center"><p className="text-red-600 text-sm">{error}</p></div>}
            {result && <SearchResultCard result={result} saving={saving} onSave={handleSave} onClose={() => { setResult(null); setError(''); setQuery(''); }} />}
          </div>
        )}

        {!result && (
          <>
            {/* Band IELTS Section */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                {T.by_band}
                {bands.length > 0 && (
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    ({bands.length} {T.deck_unit})
                  </span>
                )}
              </h2>
              <div className="h-px bg-gray-100 mb-5" />
              {loadingData ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
              ) : (
                <BandDeckCards bands={bands} />
              )}
            </section>

            {/* Topic Section */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                {T.by_topic}
                {topics.length > 0 && (
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    ({topics.length} {T.deck_unit})
                  </span>
                )}
              </h2>
              <div className="h-px bg-gray-100 mb-5" />
              {loadingData ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
              ) : (
                <TopicDeckCards topics={topics} />
              )}
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
