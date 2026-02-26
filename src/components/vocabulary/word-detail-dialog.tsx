'use client';

import { VocabWord } from '@/types/vocab.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

interface WordDetailDialogProps {
  word: VocabWord | null;
  open: boolean;
  onClose: () => void;
}

/** Highlights the target word within the example sentence */
function HighlightedExample({ example, word }: { example: string; word: string }) {
  const baseWord = word.toLowerCase().split(' ')[0];
  // Split on captured group so match parts are kept in the array
  const splitRegex = new RegExp(`(${baseWord}\\w*)`, 'gi');
  const parts = example.split(splitRegex);

  return (
    <p className="text-sm text-gray-700 italic">
      {parts.map((part, i) => {
        // Create a fresh regex each test to avoid stateful lastIndex issues
        const isMatch = new RegExp(`^${baseWord}\\w*$`, 'i').test(part);
        return isMatch ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </p>
  );
}

export function WordDetailDialog({ word, open, onClose }: WordDetailDialogProps) {
  if (!word) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {word.word}
            </DialogTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" disabled>
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{word.phonetic}</span>
            <Badge variant="secondary" className="text-xs">
              {word.partOfSpeech}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Định nghĩa</p>
            <p className="text-gray-800">{word.definition}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Ví dụ</p>
            <HighlightedExample example={word.example} word={word.word} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
              Dịch nghĩa (Tiếng Việt)
            </p>
            <p className="text-blue-700 font-medium">{word.translation}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
