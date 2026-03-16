'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Languages, BookOpen, Key } from 'lucide-react';
import { translateSentence, type SentenceTranslateResult } from '@/lib/vocab-api';

interface Props {
  text: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function SentenceTranslationPopup({ text, position, onClose }: Props) {
  const [data, setData] = useState<SentenceTranslateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    translateSentence(text)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.message || 'Không thể dịch câu. Thử lại sau.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); };
  }, [text]);

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 420),
    top: Math.min(position.y + 10, window.innerHeight - 420),
    zIndex: 50,
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div style={style} className="w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Languages className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Dịch câu</span>
              </div>
              <p className="text-[13px] text-gray-500 italic leading-relaxed line-clamp-2">{text}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
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
                <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                <span className="text-xs text-gray-400 ml-2">Đang dịch...</span>
              </div>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-4">{error}</p>
          ) : data ? (
            <>
              {/* Vietnamese translation */}
              {data.translation && (
                <div className="flex gap-2">
                  <Languages className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Bản dịch</p>
                    <p className="text-[15px] font-semibold text-blue-600 leading-relaxed mt-0.5">{data.translation}</p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {data.explanation && (
                <div className="flex gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Giải thích</p>
                    <p className="text-[13px] text-gray-600 leading-relaxed mt-0.5">{data.explanation}</p>
                  </div>
                </div>
              )}

              {/* Key points */}
              {data.keyPoints && (
                <div className="flex gap-2">
                  <Key className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Điểm ngữ pháp / từ vựng</p>
                    <p className="text-[13px] text-gray-600 leading-relaxed mt-0.5">{data.keyPoints}</p>
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
