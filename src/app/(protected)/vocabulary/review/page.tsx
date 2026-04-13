'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import { Button } from '@/components/ui/button';
import { FlashcardViewer } from '@/components/vocabulary/flashcard-viewer';
import { getDueReview, submitReview, getReviewStats } from '@/lib/vocab-api';
import { VocabWord, ReviewStats } from '@/types/vocab.types';
import { toast } from 'sonner';

export default function ReviewPage() {
  const router = useRouter();
  const [words, setWords] = useState<VocabWord[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewedCount, setReviewedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState<ReviewStats | null>(null);

  const loadWords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const loaded = await getDueReview(20);
      setWords(loaded);
      setIndex(0);
      setFlipped(false);
      setReviewedCount(0);
      setDone(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải từ vựng');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load words on mount
  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const handleReview = useCallback(async (quality: number) => {
    const currentWord = words[index];
    try {
      await submitReview(currentWord.id, quality);
    } catch {
      toast.error('Không thể lưu đánh giá');
    }
    const nextCount = reviewedCount + 1;
    setReviewedCount(nextCount);

    if (nextCount >= words.length) {
      try {
        const s = await getReviewStats();
        setStats(s);
      } catch {
        // non-critical
      }
      setDone(true);
    } else {
      setFlipped(false);
      setIndex((i) => i + 1);
    }
  }, [words, index, reviewedCount]);

  // Keyboard shortcuts
  useEffect(() => {
    if (done || loading) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [done, loading]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || words.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <ChibiMascot mood="happy" size={80} />
        <h2 className="text-2xl font-bold text-gray-900">
          {words.length === 0 ? 'Chưa có từ cần ôn!' : 'Lỗi tải dữ liệu'}
        </h2>
        <p className="text-gray-600">
          {words.length === 0
            ? 'Hãy lưu một số từ vựng trước, chúng sẽ xuất hiện ở đây khi cần ôn tập.'
            : error}
        </p>
        <Button onClick={() => router.push('/vocabulary')}>
          Quay lại từ vựng
        </Button>
      </div>
    );
  }

  // Completion screen
  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <ChibiAnimationStyles />
        <ChibiMascot mood="excited" size={80} />
        <h2 className="text-2xl font-bold text-gray-900">Hoàn thành ôn tập!</h2>
        <p className="text-gray-600">Bạn đã ôn tập {reviewedCount} từ hôm nay.</p>
        {stats && (
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="rounded-xl border bg-blue-50 p-4">
              <p className="text-2xl font-bold text-blue-600">{reviewedCount}</p>
              <p className="text-xs text-gray-500 mt-1">Đã ôn hôm nay</p>
            </div>
            <div className="rounded-xl border bg-emerald-50 p-4">
              <p className="text-2xl font-bold text-emerald-600">{stats.masteredCount}</p>
              <p className="text-xs text-gray-500 mt-1">Đã thành thạo</p>
            </div>
          </div>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={loadWords}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Ôn lại
          </Button>
          <Button onClick={() => router.push('/vocabulary')}>
            Quay lại từ vựng
          </Button>
        </div>
      </div>
    );
  }

  const currentWord = words[index];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/vocabulary')} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <div className="text-center">
          <h1 className="font-semibold text-gray-900">Ôn tập từ vựng</h1>
          <p className="text-xs text-gray-500">Spaced Repetition</p>
        </div>
        <Button variant="ghost" size="icon" onClick={loadWords} title="Tải lại">
          <RotateCcw className="h-4 w-4" />
        </Button>
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
      <FlashcardViewer
        word={currentWord}
        detail={null}
        loadingDetail={false}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        onReview={handleReview}
      />

      {/* Keyboard hint */}
      <p className="text-center text-xs text-gray-400">
        Phím tắt: <kbd className="rounded border px-1 py-0.5 text-xs">Space</kbd> lật thẻ
      </p>
    </div>
  );
}
