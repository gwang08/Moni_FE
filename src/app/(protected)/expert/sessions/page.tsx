'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Clock3,
  Search,
  Headphones,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types/auth.types';
import type { ScoringSession } from '@/types/expert.types';

type StatusFilter = 'ALL' | 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const STATUS_META: Record<
  Exclude<StatusFilter, 'ALL'>,
  { label: string; cls: string; icon: typeof CheckCircle2 }
> = {
  QUEUED: { label: 'Đang chờ', cls: 'text-amber-600 bg-amber-50 ring-amber-100', icon: Clock3 },
  IN_PROGRESS: { label: 'Đang diễn ra', cls: 'text-blue-600 bg-blue-50 ring-blue-100', icon: PlayCircle },
  COMPLETED: { label: 'Hoàn thành', cls: 'text-emerald-600 bg-emerald-50 ring-emerald-100', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã huỷ', cls: 'text-gray-400 bg-gray-50 ring-gray-100', icon: XCircle },
};

const SKILL_TINT: Record<string, { text: string; bg: string }> = {
  SPEAKING: { text: 'text-orange-700', bg: 'bg-orange-50' },
  WRITING: { text: 'text-emerald-700', bg: 'bg-emerald-50' },
};

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ExpertSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ScoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [startingId, setStartingId] = useState<number | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<ScoringSession[]>>(
        '/api/v1/expert/sessions/history',
        true,
      );
      setSessions(res.result ?? []);
    } catch {
      toast.error('Không thể tải danh sách phiên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const counts = useMemo(() => {
    const c = { ALL: sessions.length, QUEUED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
    sessions.forEach((s) => {
      c[s.status] = (c[s.status] ?? 0) + 1;
    });
    return c as Record<StatusFilter, number>;
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions
      .filter((s) => statusFilter === 'ALL' || s.status === statusFilter)
      .filter((s) => {
        if (!q) return true;
        return (
          String(s.id).includes(q) ||
          (s.userDisplayName ?? '').toLowerCase().includes(q) ||
          (s.testTitle ?? '').toLowerCase().includes(q) ||
          s.skill.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ta = new Date(a.createdAt ?? '').getTime() || 0;
        const tb = new Date(b.createdAt ?? '').getTime() || 0;
        return sort === 'newest' ? tb - ta : ta - tb;
      });
  }, [sessions, statusFilter, sort, query]);

  const handleStart = async (id: number) => {
    if (startingId) return;
    setStartingId(id);
    try {
      await apiClient.patch<ApiResponse<ScoringSession>>(
        `/api/v1/expert/sessions/${id}/start`,
        {},
        true,
      );
      toast.success('Đã nhận phiên!');
      router.push(`/expert/session/${id}`);
    } catch {
      toast.error('Không thể bắt đầu phiên');
      setStartingId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAF9]">
      {/* Header */}
      <section className="bg-white border-b border-gray-200/70">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Lịch sử chấm
            </p>
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight mt-0.5">
              Tất cả phiên
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              Quản lý, lọc và xem lại mọi phiên chấm bạn đã tham gia.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo học viên, tên bài, mã phiên..."
                className="pl-9 pr-3 h-10 w-72 rounded-xl border border-gray-200 bg-white text-[13px] focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
              className="h-10 rounded-xl border border-gray-200 bg-white text-[12.5px] px-3 font-medium"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
            <button
              onClick={fetchSessions}
              className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-[12.5px] font-semibold text-gray-600 hover:text-gray-900 hover:border-gray-300 inline-flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="max-w-6xl mx-auto px-6 pb-5 flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as StatusFilter[]).map((s) => {
            const active = statusFilter === s;
            const label = s === 'ALL' ? 'Tất cả' : STATUS_META[s].label;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 h-8 rounded-full text-[12px] font-semibold inline-flex items-center gap-2 transition-all whitespace-nowrap ${
                  active
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {label}
                <span
                  className={`text-[10.5px] font-bold tabular-nums px-1.5 rounded ${
                    active ? 'bg-white/15 text-white/90' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {counts[s] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* List */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 py-20 flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-[13.5px] font-bold text-gray-700">Không tìm thấy phiên</p>
            <p className="text-[12px] text-gray-500 mt-1 max-w-sm">
              Thử thay đổi bộ lọc hoặc xoá từ khoá tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                starting={startingId === s.id}
                onStart={() => handleStart(s.id)}
                onOpen={() => router.push(`/expert/session/${s.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionRow({
  session,
  starting,
  onStart,
  onOpen,
}: {
  session: ScoringSession;
  starting: boolean;
  onStart: () => void;
  onOpen: () => void;
}) {
  const meta = STATUS_META[session.status];
  const tint = SKILL_TINT[session.skill] ?? SKILL_TINT.SPEAKING;
  const StatusIcon = meta.icon;

  return (
    <div className="group bg-white rounded-2xl border border-gray-200/80 hover:border-gray-300 hover:shadow-sm transition-all overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        {/* Left identity */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`h-11 w-11 rounded-xl ${tint.bg} flex flex-col items-center justify-center shrink-0`}
          >
            <span className={`text-[9px] font-bold uppercase tracking-wider ${tint.text}`}>
              {session.skill.slice(0, 4)}
            </span>
            <span className={`text-[13px] font-bold ${tint.text} leading-none`}>#{session.id}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold text-gray-900 truncate">
                {session.userDisplayName ?? 'Học viên ẩn danh'}
              </p>
              {session.userRating && (
                <span className="text-[11px] text-amber-500">{'⭐'.repeat(session.userRating)}</span>
              )}
            </div>
            <p className="text-[11.5px] text-gray-500 mt-0.5 truncate">
              {session.testTitle || session.stimulusTitle || 'Không có tên bài'} ·{' '}
              {formatDate(session.createdAt)}
            </p>
          </div>
        </div>

        {/* Status */}
        <div
          className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full ring-1 ${meta.cls}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {meta.label}
        </div>

        {/* Recordings indicator */}
        {(session.recordingUrl || session.expertRecordingUrl) && (
          <div className="hidden md:flex items-center gap-1 text-[11px] text-gray-400">
            <Headphones className="h-3.5 w-3.5" />
            {session.recordingUrl && session.expertRecordingUrl ? '2 bản ghi' : '1 bản ghi'}
          </div>
        )}

        {/* Action */}
        <div className="shrink-0">
          {session.status === 'QUEUED' && (
            <button
              onClick={onStart}
              disabled={starting}
              className="h-9 px-3.5 rounded-lg bg-gray-900 hover:bg-emerald-600 text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 disabled:opacity-60 transition-colors"
            >
              {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Nhận phiên'}
            </button>
          )}
          {session.status === 'IN_PROGRESS' && (
            <button
              onClick={onOpen}
              className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-bold"
            >
              Tiếp tục
            </button>
          )}
          {session.status === 'COMPLETED' && (
            <button
              onClick={onOpen}
              className="h-9 px-3.5 rounded-lg border border-gray-200 text-gray-700 text-[12.5px] font-semibold hover:border-gray-900 hover:text-gray-900 inline-flex items-center gap-1.5 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" /> Xem lại
            </button>
          )}
          {session.status === 'CANCELLED' && <span className="text-[12px] text-gray-400">—</span>}
        </div>
      </div>

      {/* Expandable audio strip */}
      {(session.recordingUrl || session.expertRecordingUrl) &&
        session.status === 'COMPLETED' && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {session.recordingUrl && (
              <AudioStrip label="Học viên" src={session.recordingUrl} tint="blue" />
            )}
            {session.expertRecordingUrl && (
              <AudioStrip label="Giảng viên" src={session.expertRecordingUrl} tint="emerald" />
            )}
          </div>
        )}
    </div>
  );
}

function AudioStrip({ label, src, tint }: { label: string; src: string; tint: 'blue' | 'emerald' }) {
  const cls =
    tint === 'blue'
      ? 'text-blue-700 bg-blue-100/70'
      : 'text-emerald-700 bg-emerald-100/70';
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10.5px] font-bold px-2 py-1 rounded-full ${cls} shrink-0`}>
        {label}
      </span>
      <audio controls src={src} className="h-8 flex-1" />
    </div>
  );
}
