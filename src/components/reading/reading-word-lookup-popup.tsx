'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, BookmarkPlus, Check, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lookupVocab, saveWord, type VocabLookupResult } from '@/lib/vocab-api';
import { toast } from 'sonner';

interface Props {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
}

/** Clamps popup so it never goes off-screen */
function resolveStyle(x: number, y: number): React.CSSProperties {
  if (typeof window === 'undefined') return { position: 'fixed', left: x, top: y, zIndex: 60 };
  const W = 300;
  const left = Math.min(Math.max(x - W / 2, 8), window.innerWidth - W - 8);
  const top = y + 14 + 240 > window.innerHeight ? y - 254 : y + 14;
  return { position: 'fixed', left, top, zIndex: 60, width: W };
}

export function ReadingWordLookupPopup({ word, position, onClose }: Props) {
  const router = useRouter();
  const [data, setData] = useState<VocabLookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData(null);
    setSaved(false);

    lookupVocab(word, undefined, controller.signal)
      .then(res => { if (!controller.signal.aborted) setData(res); })
      .catch(err => { if (!controller.signal.aborted) setError(err?.message || 'Không thể tra từ.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [word]);

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      await saveWord(word);
      setSaved(true);
      toast.success(`Đã lưu "${word}" vào sổ từ`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu từ');
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetail = () => {
    onClose();
    router.push(`/vocabulary?q=${encodeURIComponent(word)}`);
  };

  return (
    <>
      {/* Backdrop — click outside to close */}
      <div className="fixed inset-0 z-50" onClick={onClose} />

      <div
        style={resolveStyle(position.x, position.y)}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden
          animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-4 pt-3.5 pb-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {loading ? (
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
              ) : data ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-gray-900">{data.word}</span>
                    {data.phonetic && (
                      <span className="text-xs text-blue-500 font-mono">{data.phonetic}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {data.pos && (
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {data.pos}
                      </span>
                    )}
                    {data.meaning && (
                      <span className="text-sm font-semibold text-emerald-600 line-clamp-1">{data.meaning}</span>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-base font-bold text-gray-900">{word}</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3 max-h-[180px] overflow-y-auto custom-scrollbar-thick">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              <span className="text-xs text-gray-400">Đang tra từ...</span>
            </div>
          ) : error ? (
            <p className="text-xs text-red-500 text-center py-4">{error}</p>
          ) : data ? (
            <div className="space-y-2">
              {data.explanation && (
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{data.explanation}</p>
              )}
              {data.examples?.[0] && (
                <p className="text-xs text-gray-400 italic line-clamp-2 pl-2 border-l-2 border-gray-200">
                  {data.examples[0]}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Action bar */}
        <div className="px-4 pb-3.5 pt-1 flex items-center gap-2 border-t border-gray-50">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              transition-colors flex-1 justify-center
              ${saved
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
              } disabled:opacity-60`}
          >
            {saving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : saved
                ? <Check className="h-3.5 w-3.5" />
                : <BookmarkPlus className="h-3.5 w-3.5" />
            }
            {saved ? 'Đã lưu' : 'Lưu vào sổ từ'}
          </button>
          <button
            onClick={handleViewDetail}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Xem chi tiết
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400
              hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}
