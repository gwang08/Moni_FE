'use client';

import { useState } from 'react';
import { Search, Loader2, Volume2, BookmarkPlus } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchWord, saveWord } from '@/lib/vocab-api';
import type { VocabSearchResult } from '@/types/vocab.types';
import { toast } from 'sonner';

export function DictionarySearchTab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VocabSearchResult | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await searchWord(q);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tìm từ. Thử lại sau.');
    } finally {
      setLoading(false);
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
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Nhập từ tiếng Anh..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || !query.trim()}>
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
