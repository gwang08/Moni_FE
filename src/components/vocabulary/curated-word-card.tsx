'use client';

import { Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CuratedWord } from '@/types/vocab.types';

export function CuratedWordCard({ word }: { word: CuratedWord }) {
  const playAudio = () => {
    if (word.audioUrl) new Audio(word.audioUrl).play().catch(() => {});
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{word.word}</p>
            {word.audioUrl && (
              <button onClick={playAudio} className="text-gray-400 hover:text-blue-500" title="Nghe phát âm">
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {word.phonetic && <p className="text-xs text-gray-400">{word.phonetic}</p>}
        </div>
        {word.pos && (
          <Badge variant="outline" className="text-xs shrink-0">{word.pos}</Badge>
        )}
      </div>
      {word.meaning && <p className="text-sm text-blue-600 font-medium">{word.meaning}</p>}
      {word.definition && <p className="text-xs text-gray-600 line-clamp-2">{word.definition}</p>}
    </div>
  );
}
