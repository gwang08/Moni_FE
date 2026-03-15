'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, Volume2, BookmarkPlus, BookmarkCheck, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchWord, saveWord, browseCurated } from '@/lib/vocab-api';
import type { VocabSearchResult, CuratedWord } from '@/types/vocab.types';
import { toast } from 'sonner';

const POS_BADGE: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-700',
  verb: 'bg-emerald-100 text-emerald-700',
  adjective: 'bg-amber-100 text-amber-700',
  adverb: 'bg-purple-100 text-purple-700',
  adj: 'bg-amber-100 text-amber-700',
  adv: 'bg-purple-100 text-purple-700',
};

const T = {
  search_placeholder: 'Nh\u1eadp t\u1eeb ti\u1ebfng Anh c\u1ea7n tra...',
  search_btn: 'Tra t\u1eeb',
  searching: '\u0110ang t\u00ecm...',
  search_error: 'Kh\u00f4ng th\u1ec3 t\u00ecm t\u1eeb. Th\u1eed l\u1ea1i sau.',
  save_error: 'Kh\u00f4ng th\u1ec3 l\u01b0u t\u1eeb',
  saved: '\u0110\u00e3 l\u01b0u',
  save: 'L\u01b0u t\u1eeb',
  saved_word: (w: string) => `\u0110\u00e3 l\u01b0u t\u1eeb "${w}"`,
  listen: 'Nghe ph\u00e1t \u00e2m',
  vn_meaning: 'Ngh\u0129a ti\u1ebfng Vi\u1ec7t',
  en_def: '\u0110\u1ecbnh ngh\u0129a ti\u1ebfng Anh',
  example: 'V\u00ed d\u1ee5',
  featured: 'T\u1eeb v\u1ef1ng n\u1ed5i b\u1eadt',
};

function FeaturedWordCard({ word, onSearch }: { word: CuratedWord; onSearch: (w: string) => void }) {
  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (word.audioUrl) new Audio(word.audioUrl).play().catch(() => {});
  };
  const posColor = word.pos
    ? (POS_BADGE[word.pos.toLowerCase()] ?? 'bg-gray-100 text-gray-600')
    : '';

  return (
    <button
      onClick={() => onSearch(word.word)}
      className="text-left w-full rounded-xl border border-gray-100 bg-white p-4 sm:p-5
        hover:border-indigo-200 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
          {word.word}
        </span>
        {word.audioUrl && (
          <span
            role="button"
            onClick={playAudio}
            className="p-1 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </span>
        )}
        {word.pos && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${posColor}`}>
            {word.pos}
          </span>
        )}
      </div>
      {word.phonetic && (
        <p className="text-xs text-gray-400 font-mono mb-1">{word.phonetic}</p>
      )}
      {word.meaning && (
        <p className="text-sm text-indigo-600 font-medium leading-snug line-clamp-2">{word.meaning}</p>
      )}
      {word.definition && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{word.definition}</p>
      )}
    </button>
  );
}

export function DictionarySearchTab() {
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

  const [featuredWords, setFeaturedWords] = useState<CuratedWord[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    browseCurated(0, 12)
      .then(page => setFeaturedWords(page.content))
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const page = await browseCurated(0, 8, undefined, undefined, q);
      setSuggestions(page.content);
      setShowSuggestions(page.content.length > 0);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value.trim()), 300);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = async (word?: string) => {
    const q = (word ?? query).trim();
    if (!q) return;
    setQuery(q);
    setShowSuggestions(false);
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await searchWord(q);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : T.search_error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) handleSearch(suggestions[activeIndex].word);
      else handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await saveWord(result.word);
      toast.success(T.saved_word(result.word));
      setResult((prev) => prev ? { ...prev, isSaved: true } : prev);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : T.save_error);
    } finally {
      setSaving(false);
    }
  };

  const playAudio = (url: string) => {
    new Audio(url).play().catch(() => {});
  };

  const posColor = result?.pos
    ? (POS_BADGE[result.pos.toLowerCase()] ?? 'bg-gray-100 text-gray-600')
    : '';

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <Input
                ref={inputRef}
                placeholder={T.search_placeholder}
                className="pl-12 h-12 text-base rounded-xl border-gray-200 shadow-sm
                  focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="h-12 px-6 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : T.search_btn}
            </Button>
          </div>

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-100
                rounded-xl shadow-lg overflow-hidden max-h-80 overflow-y-auto"
            >
              {loadingSuggestions && (
                <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {T.searching}
                </div>
              )}
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors
                    ${i === activeIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'}
                    ${i > 0 ? 'border-t border-gray-50' : ''}`}
                  onClick={() => handleSearch(s.word)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <Search className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{s.word}</span>
                      {s.pos && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                          ${POS_BADGE[s.pos.toLowerCase()] ?? 'bg-gray-100 text-gray-600'}`}>
                          {s.pos}
                        </span>
                      )}
                    </div>
                    {s.meaning && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{s.meaning}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-2xl mx-auto rounded-xl bg-red-50 border border-red-100 p-4 text-center">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 sm:p-6 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                      {result.word}
                    </h2>
                    {result.audioUrl && (
                      <button
                        onClick={() => playAudio(result.audioUrl!)}
                        className="p-2 rounded-lg bg-indigo-50 text-indigo-500
                          hover:bg-indigo-100 transition-colors"
                        title={T.listen}
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {result.phonetic && (
                    <p className="text-sm text-indigo-500 font-mono">{result.phonetic}</p>
                  )}
                  {result.pos && (
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold
                      uppercase tracking-wider ${posColor}`}>
                      {result.pos}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={result.isSaved ? 'secondary' : 'default'}
                  onClick={handleSave}
                  disabled={saving || result.isSaved}
                  className={`gap-1.5 shrink-0 rounded-lg text-xs ${
                    result.isSaved
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {result.isSaved
                    ? <><BookmarkCheck className="h-3.5 w-3.5" /> {T.saved}</>
                    : <><BookmarkPlus className="h-3.5 w-3.5" /> {T.save}</>
                  }
                </Button>
              </div>
            </div>

            <div className="mx-5 sm:mx-6 border-t border-gray-100" />

            <div className="p-5 sm:p-6 space-y-4">
              {result.meaning && (
                <div className="rounded-lg bg-indigo-50/70 border border-indigo-100 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1.5">
                    {T.vn_meaning}
                  </p>
                  <p className="text-lg sm:text-xl text-indigo-900 font-bold leading-relaxed">
                    {result.meaning}
                  </p>
                </div>
              )}
              {result.definition && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    {T.en_def}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.definition}</p>
                </div>
              )}
              {result.example && (
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    {T.example}
                  </p>
                  <p className="text-sm text-gray-600 italic leading-relaxed">
                    &ldquo;{result.example}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Featured words - show when idle */}
      {!result && !loading && !error && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {T.featured}
            </h3>
          </div>
          {loadingFeatured ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featuredWords.map(w => (
                <FeaturedWordCard key={w.id} word={w} onSearch={handleSearch} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
