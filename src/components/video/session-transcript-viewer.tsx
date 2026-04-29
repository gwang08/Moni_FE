'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, FileText, Search, Info, GraduationCap, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getSessionTranscripts, type TranscriptEntry } from '@/lib/session-transcripts-api';

interface SessionTranscriptViewerProps {
  sessionId: number;
  /** Optional preloaded entries (skip the fetch). */
  initialEntries?: TranscriptEntry[];
  /** Whose perspective is viewing — controls bubble alignment. Default 'LEARNER'. */
  myRole?: 'EXPERT' | 'LEARNER' | 'ADMIN';
  className?: string;
  /** Hide the disclaimer banner (e.g. when shown inside a modal that already explains). */
  hideDisclaimer?: boolean;
}

// Backend returns LocalDateTime without timezone (e.g. "2026-04-29T06:14:22").
// The original instant was UTC (frontend sent ISO with Z), so append Z to parse correctly,
// otherwise the browser interprets the string as local time and shifts the displayed value.
function parseSpokenAt(iso: string): Date {
  const normalized = iso.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
  return new Date(normalized);
}

function fmtTime(iso: string): string {
  try {
    return parseSpokenAt(iso).toLocaleTimeString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function shouldStartNewGroup(prev: TranscriptEntry | undefined, curr: TranscriptEntry): boolean {
  if (!prev) return true;
  if (prev.speakerRole !== curr.speakerRole) return true;
  // Group consecutive utterances within 60s into a single bubble cluster
  const gap = parseSpokenAt(curr.spokenAt).getTime() - parseSpokenAt(prev.spokenAt).getTime();
  return gap > 60_000;
}

interface BubbleGroup {
  speakerRole: string;
  speakerName: string;
  startedAt: string;
  messages: TranscriptEntry[];
}

function groupBySpeakerAndTime(entries: TranscriptEntry[]): BubbleGroup[] {
  const groups: BubbleGroup[] = [];
  for (const entry of entries) {
    const prev = groups[groups.length - 1];
    const prevLast = prev?.messages[prev.messages.length - 1];
    if (shouldStartNewGroup(prevLast, entry)) {
      groups.push({
        speakerRole: entry.speakerRole,
        speakerName: entry.speakerName,
        startedAt: entry.spokenAt,
        messages: [entry],
      });
    } else {
      prev.messages.push(entry);
    }
  }
  return groups;
}

function SpeakerAvatar({ role }: { role: string }) {
  const isExpert = role === 'EXPERT';
  return (
    <div
      className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center shadow-sm border-2 ${
        isExpert ? 'bg-blue-500 border-blue-200 text-white' : 'bg-emerald-500 border-emerald-200 text-white'
      }`}
      aria-label={isExpert ? 'Giảng viên' : 'Học viên'}
    >
      {isExpert ? <GraduationCap className="h-4 w-4" /> : <User className="h-4 w-4" />}
    </div>
  );
}

export function SessionTranscriptViewer({
  sessionId,
  initialEntries,
  myRole = 'LEARNER',
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

  const groups = useMemo(() => groupBySpeakerAndTime(filtered), [filtered]);

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

      <div className="flex-1 overflow-y-auto pr-1 max-h-[60vh] space-y-4 px-1 py-2">
        {groups.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-6">Không có dòng nào khớp</div>
        ) : (
          groups.map((group, idx) => {
            const isMine = group.speakerRole === myRole;
            const alignRight = isMine;
            return (
              <ChatBubbleGroup
                key={`${group.speakerRole}-${group.startedAt}-${idx}`}
                group={group}
                alignRight={alignRight}
              />
            );
          })
        )}
      </div>

      <div className="text-[11px] text-gray-400 text-right">{entries.length} dòng phụ đề</div>
    </div>
  );
}

function ChatBubbleGroup({ group, alignRight }: { group: BubbleGroup; alignRight: boolean }) {
  const isExpert = group.speakerRole === 'EXPERT';
  return (
    <div className={`flex gap-2 ${alignRight ? 'flex-row-reverse' : 'flex-row'}`}>
      <SpeakerAvatar role={group.speakerRole} />
      <div className={`flex flex-col gap-1 max-w-[78%] ${alignRight ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 text-[11px] ${alignRight ? 'flex-row-reverse' : ''}`}>
          <span className={`font-semibold ${isExpert ? 'text-blue-700' : 'text-emerald-700'}`}>
            {isExpert ? 'GV' : 'HV'} · {group.speakerName}
          </span>
          <span className="text-gray-400 tabular-nums">{fmtTime(group.startedAt)}</span>
        </div>
        <div className={`flex flex-col gap-1 ${alignRight ? 'items-end' : 'items-start'}`}>
          {group.messages.map((m) => (
            <div
              key={m.id}
              className={`px-3.5 py-2 rounded-2xl text-sm leading-snug shadow-sm ${
                alignRight
                  ? 'bg-emerald-500 text-white rounded-br-md'
                  : isExpert
                  ? 'bg-blue-50 text-blue-950 border border-blue-100 rounded-bl-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
