'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, Volume2, BookmarkPlus } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchWord, saveWord, browseCurated } from '@/lib/vocab-api';
import type { VocabSearchResult, CuratedWord } from '@/types/vocab.types';
import { toast } from 'sonner';

export function DictionarySearchTab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VocabSearchResult | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<CuratedWord[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

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

  // Close suggestions on outside click
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
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tìm từ. Thử lại sau.');
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
      if (activeIndex >= 0) {
        handleSearch(suggestions[activeIndex].word);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await saveWord(result.word);
      toast.success(`Đã lưu từ "${result.word}"`);
      setResult((prev) => prev ? { ...prev, isSaved: true } : prev);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu từ');
    } finally {
      setSaving(false);
    }
  };

  const playAudio = (url: string) => {
    new Audio(url).play().catch(() => {});
  };

  return (
    <div className="space-y-6">
      {/* Search input with autocomplete */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input
            ref={inputRef}
            placeholder="Nhập từ tiếng Anh..."
            className="pl-9"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200
                rounded-xl shadow-lg overflow-hidden max-h-80 overflow-y-auto"
            >
              {loadingSuggestions && (
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Đang tìm...
                </div>
              )}
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors
                    ${i === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    ${i > 0 ? 'border-t border-gray-50' : ''}`}
                  onClick={() => handleSearch(s.word)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <Search className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900">{s.word}</span>
                    {s.pos && (
                      <span className="ml-2 text-xs text-gray-400 italic">{s.pos}</span>
                    )}
                    {s.meaning && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{s.meaning}</p>
                    )}
                  </div>
                  {s.band && (
                    <span className="text-[10px] font-medium text-gray-400 shrink-0">
                      Band {s.band}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button onClick={() => handleSearch()} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tra từ'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {result && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          {/* Word header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-gray-900">{result.word}</h3>
                {result.phonetic && (
                  <span className="text-sm text-blue-600 font-mono">{result.phonetic}</span>
                )}
                {result.audioUrl && (
                  <button
                    onClick={() => playAudio(result.audioUrl!)}
                    className="p-1 rounded text-gray-400 hover:text-blue-500 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {result.pos && (
                <Badge variant="secondary" className="mt-1 text-xs">{result.pos}</Badge>
              )}
            </div>
            <Button
              size="sm"
              variant={result.isSaved ? 'secondary' : 'default'}
              onClick={handleSave}
              disabled={saving || result.isSaved}
              className="gap-1 shrink-0"
            >
              <BookmarkPlus className="h-4 w-4" />
              {result.isSaved ? 'Đã lưu' : 'Lưu từ'}
            </Button>
          </div>

          {/* Definition */}
          {result.definition && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Định nghĩa</p>
              <p className="text-gray-800">{result.definition}</p>
            </div>
          )}

          {/* Vietnamese meaning */}
          {result.meaning && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Nghĩa tiếng Việt</p>
              <p className="text-blue-700 font-medium">{result.meaning}</p>
            </div>
          )}

          {/* Example */}
          {result.example && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Ví dụ</p>
              <p className="text-sm text-gray-700 italic">{result.example}</p>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-12">
          <ChibiAnimationStyles />
          <ChibiMascot mood="thinking" size={72} />
          <p className="text-gray-500 mt-2">Hãy nhập từ bạn muốn tra nhé!</p>
        </div>
      )}
    </div>
  );
}
