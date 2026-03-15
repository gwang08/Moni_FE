'use client';

import { useState } from 'react';
import { Trash2, Loader2, Volume2 } from 'lucide-react';
import { deleteWord } from '@/lib/vocab-api';
import type { VocabWord } from '@/types/vocab.types';
import { toast } from 'sonner';

const POS_BADGE: Record<string, string> = {
  noun: 'bg-blue-500 text-white',
  verb: 'bg-emerald-500 text-white',
  adjective: 'bg-amber-500 text-white',
  adverb: 'bg-purple-500 text-white',
  adj: 'bg-amber-500 text-white',
  adv: 'bg-purple-500 text-white',
};

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

  const posColor = word.pos
    ? (POS_BADGE[word.pos.toLowerCase()] ?? 'bg-gray-500 text-white')
    : '';

  return (
    <div className="group flex items-start gap-4 p-5 sm:p-6 rounded-2xl border border-gray-100
      bg-white shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex-1 min-w-0">
        {/* Word + phonetic + audio + POS */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            {word.word}
          </span>
          {word.audioUrl && (
            <button
              onClick={playAudio}
              className="p-2 rounded-xl bg-indigo-50 text-indigo-500
                hover:bg-indigo-100 transition-colors"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
          {word.pos && (
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase
              tracking-wider ${posColor}`}>
              {word.pos}
            </span>
          )}
        </div>

        {/* Phonetic */}
        {word.phonetic && (
          <p className="text-sm text-indigo-400 font-mono mt-0.5">{word.phonetic}</p>
        )}

        {/* Vietnamese meaning */}
        {word.meaning && (
          <p className="text-base sm:text-lg text-indigo-700 font-semibold mt-2 leading-snug">
            {word.meaning}
          </p>
        )}

        {/* English definition */}
        {word.definition && (
          <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
            {word.definition}
          </p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 p-2.5 rounded-xl text-gray-300 hover:text-red-500
          hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
        title="Xóa từ"
      >
        {deleting
          ? <Loader2 className="h-5 w-5 animate-spin" />
          : <Trash2 className="h-5 w-5" />
        }
      </button>
    </div>
  );
}
