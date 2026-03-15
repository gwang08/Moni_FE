'use client';

import { useState } from 'react';
import { Trash2, Loader2, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { deleteWord } from '@/lib/vocab-api';
import type { VocabWord } from '@/types/vocab.types';
import { toast } from 'sonner';

interface VocabWordRowProps {
  word: VocabWord;
  onDelete: (id: number) => void;
}

export function VocabWordRow({ word, onDelete }: VocabWordRowProps) {
  const [deleting, setDeleting] = useState(false);

  const playAudio = () => {
    if (word.audioUrl) new Audio(word.audioUrl).play().catch(() => {});
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteWord(word.id);
      onDelete(word.id);
      toast.success(`Đã xóa "${word.word}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa từ');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{word.word}</span>
          {word.phonetic && <span className="text-xs text-gray-400">{word.phonetic}</span>}
          {word.audioUrl && (
            <button onClick={playAudio} className="text-gray-400 hover:text-blue-500">
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          )}
          {word.pos && <Badge variant="outline" className="text-xs">{word.pos}</Badge>}
        </div>
        {word.meaning && <p className="text-xs text-blue-600 mt-0.5">{word.meaning}</p>}
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-gray-300 hover:text-red-500 transition-colors p-1"
        title="Xóa từ"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
