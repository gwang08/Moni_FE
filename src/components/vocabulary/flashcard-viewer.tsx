'use client';

import { Volume2 } from 'lucide-react';
import { VocabWord } from '@/types/vocab.types';

interface FlashcardViewerProps {
  word: VocabWord;
  flipped: boolean;
  onFlip: () => void;
}

export function FlashcardViewer({ word, flipped, onFlip }: FlashcardViewerProps) {
  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (word.audioUrl) new Audio(word.audioUrl).play().catch(() => {});
  };

  return (
    <div
      className="w-full max-w-xl mx-auto cursor-pointer"
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
        {/* Front face */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center
            rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 p-8"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-4xl font-bold text-gray-900 text-center">{word.word}</p>
          {word.phonetic && (
            <p className="mt-3 text-lg text-gray-500">{word.phonetic}</p>
          )}
          {word.audioUrl && (
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

        {/* Back face */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3
            rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-100 p-8"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {word.definition && (
            <p className="text-base font-semibold text-gray-800 text-center">{word.definition}</p>
          )}
          {word.example && (
            <p className="text-sm text-gray-600 italic text-center">{word.example}</p>
          )}
          {word.meaning && (
            <p className="mt-2 text-blue-700 font-semibold text-center">{word.meaning}</p>
          )}
          <p className="mt-4 text-xs text-gray-400">Nhấn để lật thẻ</p>
        </div>
      </div>
    </div>
  );
}
