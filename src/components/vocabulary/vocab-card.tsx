'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { VocabWord } from '@/types/vocab.types';
import { Badge } from '@/components/ui/badge';
import { WordDetailDialog } from './word-detail-dialog';

interface VocabCardProps {
  word: VocabWord;
}

export function VocabCard({ word }: VocabCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (word.audioUrl) new Audio(word.audioUrl).play().catch(() => {});
  };

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="w-full text-left rounded-lg border border-gray-200 bg-white p-4 shadow-sm
          hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 truncate">{word.word}</p>
              {word.audioUrl && (
                <button onClick={playAudio} className="text-gray-400 hover:text-blue-500 shrink-0">
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{word.phonetic}</p>
          </div>
          {word.pos && (
            <Badge variant="outline" className="shrink-0 text-xs">{word.pos}</Badge>
          )}
        </div>
        {word.meaning && (
          <p className="mt-2 text-sm text-blue-600 font-medium">{word.meaning}</p>
        )}
        {word.definition && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{word.definition}</p>
        )}
      </button>

      <WordDetailDialog
        word={word}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
