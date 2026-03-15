'use client';

import { useState } from 'react';
import { VocabWord } from '@/types/vocab.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, BookmarkPlus, Loader2 } from 'lucide-react';
import { saveWord } from '@/lib/vocab-api';
import { toast } from 'sonner';

interface WordDetailDialogProps {
  word: VocabWord | null;
  open: boolean;
  onClose: () => void;
}

/** Highlights the target word within the example sentence */
function HighlightedExample({ example, word }: { example: string; word: string }) {
  const baseWord = word.toLowerCase().split(' ')[0];
  const splitRegex = new RegExp(`(${baseWord}\\w*)`, 'gi');
  const parts = example.split(splitRegex);

  return (
    <p className="text-sm text-gray-700 italic">
      {parts.map((part, i) => {
        const isMatch = new RegExp(`^${baseWord}\\w*$`, 'i').test(part);
        return isMatch ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </p>
  );
}

export function WordDetailDialog({ word, open, onClose }: WordDetailDialogProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!word) return null;

  const playAudio = () => {
    if (word.audioUrl) new Audio(word.audioUrl).play().catch(() => {});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWord(word.word);
      setSaved(true);
      toast.success(`Đã lưu từ "${word.word}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu từ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {word.word}
            </DialogTitle>
            <button
              onClick={playAudio}
              disabled={!word.audioUrl}
              className="p-1 rounded text-gray-400 hover:text-blue-500 disabled:opacity-30 transition-colors"
              title="Nghe phát âm"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {word.phonetic && (
              <span className="text-sm text-gray-500">{word.phonetic}</span>
            )}
            {word.pos && (
              <Badge variant="secondary" className="text-xs">{word.pos}</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {word.definition && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Định nghĩa</p>
              <p className="text-gray-800">{word.definition}</p>
            </div>
          )}

          {word.example && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Ví dụ</p>
              <HighlightedExample example={word.example} word={word.word} />
            </div>
          )}

          {word.meaning && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
                Dịch nghĩa (Tiếng Việt)
              </p>
              <p className="text-blue-700 font-medium">{word.meaning}</p>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || saved}
            className="w-full gap-2"
            variant={saved ? 'secondary' : 'default'}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookmarkPlus className="h-4 w-4" />
            )}
            {saved ? 'Đã lưu' : 'Lưu từ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
