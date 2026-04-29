'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, FileText, Search, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getSessionTranscripts, type TranscriptEntry } from '@/lib/session-transcripts-api';

interface SessionTranscriptViewerProps {
  sessionId: number;
  /** Optional preloaded entries (skip the fetch). */
  initialEntries?: TranscriptEntry[];
  className?: string;
  /** Hide the disclaimer banner (e.g. when shown inside a modal that already explains). */
  hideDisclaimer?: boolean;
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

export function SessionTranscriptViewer({
  sessionId,
  initialEntries,
  className = '',
  hideDisclaimer = false,
}: SessionTranscriptViewerProps) {
  const [entries, setEntries] = useState<TranscriptEntry[]>(initialEntries ?? []);
  const [loading, setLoading] = useState(!initialEntries);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialEntries) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await getSessionTranscripts(sessionId);
        if (!cancelled) setEntries(data);
      } catch {
        if (!cancelled) setError('Không tải được phụ đề phiên này');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, initialEntries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.text.toLowerCase().includes(q) || e.speakerName.toLowerCase().includes(q));
  }, [entries, search]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return <div className={`text-sm text-red-500 py-4 ${className}`}>{error}</div>;
  }

  if (entries.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
        <FileText className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">Chưa có phụ đề nào cho phiên này</p>
        <p className="text-xs text-gray-400 mt-1">Phụ đề chỉ được lưu khi bật CC trong cuộc gọi</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {!hideDisclaimer && (
        <div className="flex gap-2 items-start px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Phụ đề tự động (Web Speech API), độ chính xác ~85%. Dùng để tra cứu nhanh, không thay thế bản ghi âm gốc.
          </span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm trong phụ đề..."
          className="pl-8 h-9 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-[60vh] pr-1">
        {filtered.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-6">Không có dòng nào khớp</div>
        ) : (
          filtered.map((e) => {
            const isExpert = e.speakerRole === 'EXPERT';
            return (
              <div
                key={e.id}
                className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg border text-sm ${
                  isExpert ? 'bg-blue-50/60 border-blue-100' : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className={`font-semibold ${isExpert ? 'text-blue-700' : 'text-gray-700'}`}>
                    {isExpert ? 'GV' : 'HV'} · {e.speakerName}
                  </span>
                  <span className="text-gray-400 tabular-nums">{fmtTime(e.spokenAt)}</span>
                </div>
                <p className="text-gray-800 leading-snug whitespace-pre-wrap">{e.text}</p>
              </div>
            );
          })
        )}
      </div>

      <div className="text-[11px] text-gray-400 text-right">{entries.length} dòng phụ đề</div>
    </div>
  );
}
