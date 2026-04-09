'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, BookmarkPlus, Check, Loader2 } from 'lucide-react';
import { saveWord } from '@/lib/vocab-api';
import { toast } from 'sonner';
import type { CuratedWord } from '@/types/vocab.types';

const POS_BADGE: Record<string, string> = {
  noun: 'bg-blue-500 text-white',
  verb: 'bg-emerald-500 text-white',
  adj: 'bg-amber-500 text-white',
  adv: 'bg-purple-500 text-white',
  adjective: 'bg-amber-500 text-white',
  adverb: 'bg-purple-500 text-white',
};

export function CuratedWordCard({ word }: { word: CuratedWord }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleClick = () => {
    router.push(`/vocabulary?q=${encodeURIComponent(word.word)}`);
  };

  const playAudio = () => {
    if (word.audioUrl) new Audio(word.audioUrl).play().catch(() => {});
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving || saved) return;
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

  const posColor = word.pos
    ? (POS_BADGE[word.pos.toLowerCase()] ?? 'bg-gray-500 text-white')
    : '';

  return (
    <div
      onClick={handleClick}
      className="group rounded-2xl border border-gray-100 bg-white p-5 sm:p-6
        shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer"
    >
      {/* Row 1: Word + phonetic + audio */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
            {word.word}
          </h3>
          {word.audioUrl && (
            <button
              onClick={playAudio}
              className="p-2 rounded-xl bg-indigo-50 text-indigo-500
                hover:bg-indigo-100 transition-colors shrink-0"
              title="Nghe phát âm"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              saved
                ? 'bg-emerald-50 text-emerald-500'
                : 'bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'
            } disabled:opacity-60`}
            title={saved ? 'Đã lưu' : 'Lưu từ vựng'}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
          </button>
        </div>
        {word.pos && (
          <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold
            uppercase tracking-wider ${posColor}`}>
            {word.pos}
          </span>
        )}
      </div>

      {/* Phonetic */}
      {word.phonetic && (
        <p className="text-sm text-indigo-400 font-mono mt-1">{word.phonetic}</p>
      )}

      {/* Vietnamese meaning - prominent */}
      {word.meaning && (
        <p className="mt-3 text-base sm:text-lg text-indigo-700 font-semibold leading-snug">
          {word.meaning}
        </p>
      )}

      {/* English definition */}
      {word.definition && (
        <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-2">
          {word.definition}
        </p>
      )}

      {/* Example */}
      {word.example && (
        <p className="mt-2 text-sm text-gray-400 italic line-clamp-1">
          &ldquo;{word.example}&rdquo;
        </p>
      )}

      {/* Band + Topic tags */}
      {(word.band || word.topic) && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
          {word.band && (
            <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md font-medium">
              Band {word.band}
            </span>
          )}
          {word.topic && (
            <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md font-medium capitalize">
              {word.topic}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
