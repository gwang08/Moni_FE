'use client';

import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VocabWord } from '@/types/vocab.types';
import { VocabDetail } from '@/lib/vocab-api';

interface FlashcardViewerProps {
  word: VocabWord;
  detail: VocabDetail | null;
  loadingDetail: boolean;
  flipped: boolean;
  onFlip: () => void;
  onReview?: (quality: number) => void;
}


export function FlashcardViewer({ word, detail, loadingDetail, flipped, onFlip, onReview }: FlashcardViewerProps) {
  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = detail?.audioUrl || word.audioUrl;
    if (url) new Audio(url).play().catch(() => {});
  };

  const handleReview = (e: React.MouseEvent, quality: number) => {
    e.stopPropagation();
    onReview?.(quality);
  };

  // Use word data directly (already loaded from vocab list)
  const phonetic = word.phonetic;
  const audioUrl = word.audioUrl;
  const meaning = word.meaning;
  const pos = word.pos;
  const example = word.example;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
      {/* Card with 3D flip */}
      <div
        className="cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={onFlip}
      >
        <div
          className="relative h-72 w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front face - English word + POS inline */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center
              rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center gap-3">
              <p className="text-4xl font-bold text-gray-900">{word.word}</p>
              {pos && (
                <span className="inline-block text-sm font-medium bg-blue-200 text-blue-700 px-3 py-1 rounded-full align-middle">
                  {pos}
                </span>
              )}
            </div>
            {audioUrl && (
              <button
                onClick={playAudio}
                className="mt-3 p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-100 transition-colors"
                title="Nghe phát âm"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            )}
            <p className="mt-4 text-xs text-gray-400">Nhấn để lật thẻ</p>
          </div>

          {/* Back face - IPA, Vietnamese meaning, Example */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center
              rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-100 p-6"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="w-full space-y-4">
              {/* IPA / Pronunciation */}
              {phonetic && (
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Cách đọc</p>
                  <p className="text-lg font-mono text-gray-700">{phonetic}</p>
                </div>
              )}

              {/* Vietnamese meaning */}
              {meaning && (
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Nghĩa tiếng Việt</p>
                  <p className="text-xl font-bold text-emerald-700">{meaning}</p>
                </div>
              )}

              {/* Example */}
              {example && (
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Ví dụ</p>
                  <p className="text-sm text-gray-600 italic leading-relaxed">{example}</p>
                </div>
              )}
            </div>
            <p className="mt-auto text-xs text-gray-400 pt-2">Nhấn để lật thẻ</p>
          </div>
        </div>
      </div>

      {/* Review buttons - show after flipping */}
      {onReview && flipped && (
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            className="flex-1 py-6 text-base font-semibold border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 rounded-2xl transition-all active:scale-95"
            onClick={(e) => handleReview(e, 1)}
          >
            <span className="mr-2 text-lg">🤔</span> Chưa biết
          </Button>
          <Button
            variant="outline"
            className="flex-1 py-6 text-base font-semibold border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 rounded-2xl transition-all active:scale-95"
            onClick={(e) => handleReview(e, 5)}
          >
            <span className="mr-2 text-lg">👍</span> Đã biết
          </Button>
        </div>
      )}
    </div>
  );
}
