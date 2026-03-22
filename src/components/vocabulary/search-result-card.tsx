'use client';

import { Volume2, BookmarkPlus, BookmarkCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VocabSearchResult } from '@/types/vocab.types';

const POS_BADGE: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-700',
  verb: 'bg-emerald-100 text-emerald-700',
  adjective: 'bg-amber-100 text-amber-700',
  adverb: 'bg-purple-100 text-purple-700',
  adj: 'bg-amber-100 text-amber-700',
  adv: 'bg-purple-100 text-purple-700',
};

const T = {
  saved: '\u0110\u00e3 l\u01b0u',
  save: 'L\u01b0u t\u1eeb',
  listen: 'Nghe ph\u00e1t \u00e2m',
  vn_meaning: 'Ngh\u0129a ti\u1ebfng Vi\u1ec7t',
  en_def: '\u0110\u1ecbnh ngh\u0129a ti\u1ebfng Anh',
  example: 'V\u00ed d\u1ee5',
};

interface Props {
  result: VocabSearchResult;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function SearchResultCard({ result, saving, onSave, onClose }: Props) {
  const playAudio = (url: string) => { new Audio(url).play().catch(() => {}); };
  const posColor = result.pos
    ? (POS_BADGE[result.pos.toLowerCase()] ?? 'bg-gray-100 text-gray-600')
    : '';

  return (
    <div className="max-w-2xl rounded-xl bg-warm-white shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 sm:p-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {result.word}
              </h2>
              {result.audioUrl && (
                <button
                  onClick={() => playAudio(result.audioUrl!)}
                  className="p-2 rounded-lg bg-indigo-50 text-indigo-500
                    hover:bg-indigo-100 transition-colors"
                  title={T.listen}
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {result.phonetic && (
              <p className="text-sm text-indigo-500 font-mono">{result.phonetic}</p>
            )}
            {result.pos && (
              <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold
                uppercase tracking-wider ${posColor}`}>
                {result.pos}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={result.isSaved ? 'secondary' : 'default'}
              onClick={onSave}
              disabled={saving || result.isSaved}
              className={`gap-1.5 rounded-lg text-xs ${
                result.isSaved
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {result.isSaved
                ? <><BookmarkCheck className="h-3.5 w-3.5" /> {T.saved}</>
                : <><BookmarkPlus className="h-3.5 w-3.5" /> {T.save}</>
              }
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500
              hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-5 sm:mx-6 border-t border-gray-100" />

      <div className="p-5 sm:p-6 space-y-4">
        {result.meaning && (
          <div className="rounded-lg bg-indigo-50/70 border border-indigo-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1.5">
              {T.vn_meaning}
            </p>
            <p className="text-lg sm:text-xl text-indigo-900 font-bold leading-relaxed">
              {result.meaning}
            </p>
          </div>
        )}
        {result.definition && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              {T.en_def}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{result.definition}</p>
          </div>
        )}
        {result.example && (
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              {T.example}
            </p>
            <p className="text-sm text-gray-600 italic leading-relaxed">
              &ldquo;{result.example}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
