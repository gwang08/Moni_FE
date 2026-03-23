'use client';

import { useState } from 'react';
import { Volume2, BookmarkPlus, BookmarkCheck, Link2, MessageSquareText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VocabLookupResult } from '@/lib/vocab-api';

const POS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  noun:      { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Danh từ' },
  verb:      { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Động từ' },
  adjective: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Tính từ' },
  adverb:    { bg: 'bg-purple-100',  text: 'text-purple-700',  label: 'Trạng từ' },
  adj:       { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Tính từ' },
  adv:       { bg: 'bg-purple-100',  text: 'text-purple-700',  label: 'Trạng từ' },
};

function speakText(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

/** Parse "English sentence. (Vietnamese translation.)" into two parts */
function parseExample(raw: string): { en: string; vi: string } {
  const match = raw.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match) return { en: match[1].trim(), vi: match[2].trim() };
  return { en: raw, vi: '' };
}

interface ExampleRowProps {
  raw: string;
}

function ExampleRow({ raw }: ExampleRowProps) {
  const { en, vi } = parseExample(raw);
  return (
    <div className="group flex items-start gap-3 rounded-xl bg-gray-50 hover:bg-indigo-50/40
      border border-transparent hover:border-indigo-100 px-4 py-3 transition-all duration-200">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 leading-relaxed">{en}</p>
        {vi && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{vi}</p>}
      </div>
      <button
        onClick={() => speakText(en)}
        className="shrink-0 mt-0.5 p-1.5 rounded-lg text-gray-300 hover:text-indigo-500
          hover:bg-indigo-100 transition-colors opacity-0 group-hover:opacity-100"
        title="Nghe câu ví dụ"
        aria-label="Nghe câu ví dụ"
      >
        <Volume2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface Props {
  result: VocabLookupResult;
  saving: boolean;
  isSaved: boolean;
  onSave: () => void;
}

export function WordResultCard({ result, saving, isSaved, onSave }: Props) {
  const [playing, setPlaying] = useState(false);

  const posKey = result.pos?.toLowerCase();
  const badge = posKey ? (POS_BADGE[posKey] ?? null) : null;

  const playWordAudio = () => {
    if (result.audioUrl) {
      setPlaying(true);
      const audio = new Audio(result.audioUrl);
      audio.play().catch(() => {});
      audio.onended = () => setPlaying(false);
    } else {
      speakText(result.word);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Word header card */}
      <div className="rounded-2xl overflow-hidden shadow-md border border-indigo-100/60">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Word + audio */}
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {result.word}
                </h2>
                <button
                  onClick={playWordAudio}
                  disabled={playing}
                  className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white
                    transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
                  title="Nghe phát âm"
                >
                  {playing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Volume2 className="h-4 w-4" />
                  }
                </button>
              </div>

              {/* Phonetic + POS */}
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                {result.phonetic && (
                  <span className="text-indigo-100 font-mono text-base">
                    {result.phonetic}
                  </span>
                )}
                {badge && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                    bg-white/20 text-white`}>
                    {badge.label}
                  </span>
                )}
              </div>

              {/* Vietnamese meaning — prominent */}
              {result.meaning && (
                <p className="mt-3 text-xl sm:text-2xl font-bold text-yellow-200 leading-snug">
                  {result.meaning}
                </p>
              )}
            </div>

            {/* Save button */}
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving || isSaved}
              className={`shrink-0 gap-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSaved
                  ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm'
              }`}
            >
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : isSaved
                  ? <><BookmarkCheck className="h-3.5 w-3.5" /> Đã lưu</>
                  : <><BookmarkPlus className="h-3.5 w-3.5" /> Lưu từ</>
              }
            </Button>
          </div>
        </div>

        {/* Content body */}
        <div className="bg-white px-6 py-5 space-y-5">
          {/* Explanation */}
          {result.explanation && (
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-amber-50">
                <MessageSquareText className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Giải thích
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
              </div>
            </div>
          )}

          {/* Collocation */}
          {result.collocation && (
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-violet-50">
                <Link2 className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Cụm từ thường gặp
                </p>
                <p className="text-sm font-semibold text-violet-700 bg-violet-50 inline-block
                  px-3 py-1 rounded-lg border border-violet-100">
                  {result.collocation}
                </p>
              </div>
            </div>
          )}

          {/* Divider */}
          {result.examples && result.examples.length > 0 && (
            <div className="h-px bg-gray-100" />
          )}

          {/* Examples */}
          {result.examples && result.examples.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Ví dụ ({result.examples.length})
              </p>
              <div className="space-y-2">
                {result.examples.map((ex, i) => (
                  <ExampleRow key={i} raw={ex} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
