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
      // Notify navbar badge để cập nhật số từ cần luyện ngay lập tức
      window.dispatchEvent(new Event('vocab-due-changed'));
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
    const masteryPct = stats ? Math.round((stats.masteredCount / Math.max(stats.masteredCount + stats.learningCount, 1)) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <ChibiAnimationStyles />
        <div className="relative rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 via-white to-white p-8 shadow-lg shadow-emerald-100/40 text-center space-y-6">
          {/* Confetti accent */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl select-none pointer-events-none">
            &#127881;
          </div>

          <ChibiMascot mood="excited" size={88} />

          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Hoàn thành ôn tập!</h2>
            <p className="text-sm text-gray-500 mt-1">Bạn đã ôn tập <span className="font-semibold text-emerald-600">{reviewedCount}</span> từ hôm nay</p>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                <p className="text-2xl font-extrabold text-blue-600">{reviewedCount}</p>
                <p className="text-[11px] font-medium text-blue-400 mt-1">Đã ôn</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-2xl font-extrabold text-emerald-600">{stats.masteredCount}</p>
                <p className="text-[11px] font-medium text-emerald-400 mt-1">Thành thạo</p>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                <p className="text-2xl font-extrabold text-amber-600">{stats.learningCount}</p>
                <p className="text-[11px] font-medium text-amber-400 mt-1">Đang học</p>
              </div>
            </div>
          )}

          {/* Mastery progress */}
          {stats && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-500">Tiến trình thành thạo</span>
                <span className="font-bold text-emerald-600">{masteryPct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                  style={{ width: `${masteryPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={loadWords}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Ôn lại
            </Button>
            <Button className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push('/vocabulary')}>
              Quay lại từ vựng
            </Button>
          </div>
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
