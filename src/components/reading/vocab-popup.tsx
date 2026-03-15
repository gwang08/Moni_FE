'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Copy, BookmarkPlus, MessageSquareText, Link2, Quote } from 'lucide-react';
import { lookupVocab, saveWord, type VocabLookupResult } from '@/lib/vocab-api';
import { toast } from 'sonner';

interface Props {
  word: string;
  sentence?: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function VocabPopup({ word, sentence, position, onClose }: Props) {
  const [data, setData] = useState<VocabLookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    lookupVocab(word, sentence, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.message || 'Không thể tra từ. Thử lại sau.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); };
  }, [word, sentence]);

  const handleCopy = () => {
    navigator.clipboard.writeText(word);
    toast.success('Đã sao chép');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWord(word, sentence);
      setSaved(true);
      toast.success(`Đã lưu từ "${word}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu từ');
    } finally {
      setSaving(false);
    }
  };

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 380),
    top: Math.min(position.y + 10, window.innerHeight - 460),
    zIndex: 50,
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div style={style} className="w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with word info */}
        <div className="px-5 pt-4 pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {loading ? (
                <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
              ) : data ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl font-bold text-gray-900">{data.word}</span>
                    {data.phonetic && (
                      <span className="text-sm text-blue-600 font-mono">{data.phonetic}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {data.pos && (
                      <span className="text-[11px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{data.pos}</span>
                    )}
                    <span className="text-[15px] font-semibold text-emerald-600">{data.meaning}</span>
                  </div>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900">{word}</span>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-white/60 transition-colors disabled:opacity-50"
                title={saved ? 'Đã lưu' : 'Lưu từ'}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
              </button>
              <button onClick={handleCopy} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors" title="Sao chép">
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-3 max-h-[340px] overflow-y-auto space-y-3">
          {loading ? (
            <div className="space-y-3 py-2">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
              <div className="flex items-center justify-center pt-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <span className="text-xs text-gray-400 ml-2">Đang tra từ...</span>
              </div>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-4">{error}</p>
          ) : data ? (
            <>
              {/* Collocation */}
              {data.collocation && (
                <div className="flex gap-2">
                  <Link2 className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Cụm từ liên quan</p>
                    <p className="text-[13px] text-gray-700 mt-0.5">{data.collocation}</p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {data.explanation && (
                <div className="flex gap-2">
                  <MessageSquareText className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Giải thích</p>
                    <p className="text-[13px] text-gray-600 leading-relaxed mt-0.5">{data.explanation}</p>
                  </div>
                </div>
              )}

              {/* Examples */}
              {data.examples && data.examples.length > 0 && (
                <div className="flex gap-2">
                  <Quote className="h-3.5 w-3.5 text-teal-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Ví dụ</p>
                    <ul className="mt-1 space-y-1.5">
                      {data.examples.map((ex, i) => (
                        <li key={i} className="text-[13px] text-gray-600 leading-relaxed pl-3 border-l-2 border-teal-200">{ex}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
