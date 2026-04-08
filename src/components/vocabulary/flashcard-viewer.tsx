'use client';

import { Volume2, Loader2 } from 'lucide-react';
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

const REVIEW_BUTTONS = [
  { label: 'Quên', quality: 1, className: 'border-red-300 text-red-600 hover:bg-red-50' },
  { label: 'Khó', quality: 3, className: 'border-orange-300 text-orange-600 hover:bg-orange-50' },
  { label: 'Tốt', quality: 4, className: 'border-green-300 text-green-600 hover:bg-green-50' },
  { label: 'Dễ', quality: 5, className: 'border-blue-300 text-blue-600 hover:bg-blue-50' },
];

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

  // Use detail data if available, fallback to basic word data
  const phonetic = detail?.phonetic || word.phonetic;
  const audioUrl = detail?.audioUrl || word.audioUrl;
  const meaning = detail?.meaning || word.meaning;
  const pos = detail?.pos || word.pos;
  const definition = detail?.definition || word.definition;
  const collocation = detail?.collocation;
  const explanation = detail?.explanation;
  const examples = detail?.examples || (word.example ? [word.example] : null);

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
          {/* Front face - English word */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center
              rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-4xl font-bold text-gray-900 text-center">{word.word}</p>
            {phonetic && (
              <p className="mt-3 text-lg text-gray-500">{phonetic}</p>
            )}
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

          {/* Back face - Vietnamese meaning + details */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center
              rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-100 p-6"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {loadingDetail ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                <span className="text-sm text-gray-500">Đang tải...</span>
              </div>
            ) : (
              <div className="w-full max-h-[240px] overflow-y-auto custom-scrollbar-thick">
                {/* Main meaning */}
                {meaning && (
                  <p className="text-xl font-bold text-emerald-700 text-center mb-3">{meaning}</p>
                )}

                {/* POS badge */}
                {pos && (
                  <span className="inline-block text-[10px] font-medium bg-emerald-200 text-emerald-700
                    px-2 py-0.5 rounded-full mb-3">{pos}</span>
                )}

                {/* Explanation */}
                {explanation && (
                  <div className="mb-3 text-center">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Giải thích</p>
                    <p className="text-xs text-gray-600 leading-relaxed mt-1">{explanation}</p>
                  </div>
                )}

                {/* Definition */}
                {definition && !explanation && (
                  <p className="text-sm text-gray-700 text-center mb-3">{definition}</p>
                )}

                {/* Examples */}
                {examples && examples.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Ví dụ</p>
                    {examples.slice(0, 2).map((ex, i) => (
                      <p key={i} className="text-xs text-gray-600 italic text-center border-l-2 border-teal-200 pl-2">
                        {ex}
                      </p>
                    ))}
                  </div>
                )}

                {/* Collocation */}
                {collocation && (
                  <div className="mt-2 text-center">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Liên quan</p>
                    <p className="text-xs text-violet-600 mt-1">{collocation}</p>
                  </div>
                )}
              </div>
            )}
            <p className="mt-auto text-xs text-gray-400 pt-2">Nhấn để lật thẻ</p>
          </div>
        </div>
      </div>

      {/* SR review buttons */}
      {onReview && flipped && (
        <div className="flex gap-2 justify-center">
          {REVIEW_BUTTONS.map(({ label, quality, className }) => (
            <Button
              key={quality}
              variant="outline"
              size="sm"
              className={`flex-1 max-w-[80px] font-medium ${className}`}
              onClick={(e) => handleReview(e, quality)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
