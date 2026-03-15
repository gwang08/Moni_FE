'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Shuffle, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlashcardViewer } from '@/components/vocabulary/flashcard-viewer';
import { getMyWords, getDueReview } from '@/lib/vocab-api';
import { VocabWord } from '@/types/vocab.types';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function FlashcardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collection');
  const mode = searchParams.get('mode'); // 'review' for due-review mode

  const [baseWords, setBaseWords] = useState<VocabWord[]>([]);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        let loaded: VocabWord[];
        if (mode === 'review') {
          loaded = await getDueReview(20);
        } else if (collectionId) {
          const page = await getMyWords(0, 100, Number(collectionId));
          loaded = page.content;
        } else {
          const page = await getMyWords(0, 50);
          loaded = page.content;
        }
        setBaseWords(loaded);
        setWords(loaded);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Không thể tải từ vựng');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [collectionId, mode]);

  const goNext = useCallback(() => {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, words.length - 1));
  }, [words.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleShuffle = () => {
    setWords(shuffleArray(baseWords));
    setIndex(0);
    setFlipped(false);
  };

  const handleReset = () => {
    setWords([...baseWords]);
    setIndex(0);
    setFlipped(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        goNext();
      } else if (e.code === 'ArrowLeft') {
        goPrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || words.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">{error || 'Không có từ vựng nào để luyện tập.'}</p>
        <Button className="mt-4" onClick={() => router.push('/vocabulary')}>
          Quay lại từ vựng
        </Button>
      </div>
    );
  }

  const currentWord = words[index];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <div className="text-center">
          <h1 className="font-semibold text-gray-900">Flashcard</h1>
          {mode === 'review' && (
            <p className="text-xs text-gray-500">Ôn tập hôm nay</p>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handleShuffle} title="Xáo trộn">
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleReset} title="Đặt lại">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="text-center">
        <span className="text-sm font-medium text-gray-600">
          {index + 1} / {words.length}
        </span>
        <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <FlashcardViewer word={currentWord} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" onClick={goPrev} disabled={index === 0} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Trước
        </Button>
        <Button variant="outline" onClick={goNext} disabled={index === words.length - 1} className="gap-2">
          Sau
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-gray-400">
        Phím tắt: <kbd className="rounded border px-1 py-0.5 text-xs">Space</kbd> lật thẻ &nbsp;
        <kbd className="rounded border px-1 py-0.5 text-xs">←</kbd>
        <kbd className="rounded border px-1 py-0.5 text-xs">→</kbd> điều hướng
      </p>
    </div>
  );
}
