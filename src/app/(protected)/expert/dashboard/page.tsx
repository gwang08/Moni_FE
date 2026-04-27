'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2, ArrowUpRight, Clock3, Sparkles, CheckCircle2, XCircle, PlayCircle, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { ExpertProfile, ScoringSession } from '@/types/expert.types';

const SKILL_TINT: Record<string, { bg: string; text: string; dot: string; ring: string }> = {
  SPEAKING: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', ring: 'ring-orange-200' },
  WRITING: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
};

function relativeTime(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
}

export default function ExpertDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [queued, setQueued] = useState<ScoringSession[]>([]);
  const [history, setHistory] = useState<ScoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<number | null>(null);
  const initRef = useRef(false);

  const fetchQueued = async () => {
    try {
      const res = await apiClient.get<ApiResponse<ScoringSession[]>>('/api/v1/expert/sessions', true);
      setQueued((res.result ?? []).filter((s) => s.status === 'QUEUED'));
    } catch { /* ignore polling errors */ }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      try {
        await apiClient.patch('/api/v1/experts/me/status', { status: 'AVAILABLE' }, true);
        const p = await apiClient.get<ApiResponse<ExpertProfile>>('/api/v1/experts/me', true);
        setProfile(p.result ?? null);
        await fetchQueued();
        apiClient
          .get<ApiResponse<ScoringSession[]>>('/api/v1/expert/sessions/history', true)
          .then((res) => setHistory(res.result ?? []))
          .catch(() => {});
      } catch {
        toast.error('Không thể tải thông tin');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(fetchQueued, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ping = () =>
      apiClient.patch('/api/v1/experts/me/status', { status: 'AVAILABLE' }, true).catch(() => {});
    const hb = setInterval(ping, 20_000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') ping();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', ping);

    return () => {
      clearInterval(hb);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', ping);
    };
  }, []);

  const handleStart = async (id: number) => {
    if (startingId) return;
    setStartingId(id);
    try {
      await apiClient.patch<ApiResponse<ScoringSession>>(`/api/v1/expert/sessions/${id}/start`, {}, true);
      toast.success('Đã nhận phiên. Đang mở phòng...');
      router.push(`/expert/session/${id}`);
    } catch {
      toast.error('Không thể bắt đầu phiên');
      setStartingId(null);
    }
  };

  const completedCount = useMemo(() => history.filter((s) => s.status === 'COMPLETED').length, [history]);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return history.filter((s) => s.createdAt && new Date(s.createdAt) >= d).length;
  }, [history]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAF9]">
      {/* Hero header */}
      <section className="bg-white border-b border-gray-200/70">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>Đang online · sẵn sàng nhận phiên</span>
            </div>
            <h1 className="mt-1 text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
              Chào {user?.fullName ?? 'Expert'},
            </h1>
            <p className="text-[14px] text-gray-500 mt-1">
              Hôm nay bạn có{' '}
              <span className="font-semibold text-gray-800">{queued.length}</span> phiên đang chờ
              {' · '}
              <span className="font-semibold text-gray-800">{today}</span> phiên đã tạo trong ngày.
            </p>
          </div>

          {/* Inline stat strip */}
          <div className="grid grid-cols-3 gap-0 rounded-2xl bg-gray-50 border border-gray-200/80 overflow-hidden min-w-[380px]">
            <StatCell label="Tổng phiên" value={String(profile?.totalSessions ?? 0)} />
            <StatCell label="Hoàn thành" value={String(completedCount)} divider />
            <StatCell label="Đánh giá" value={(profile?.rating ?? 0).toFixed(1)} trailing="⭐" divider />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Queued */}
        <section>
          <SectionHeader
            title="Phiên đang chờ"
            subtitle="Các học viên đang xếp hàng được chấm"
            count={queued.length}
            accent="live"
          />

          {queued.length === 0 ? (
            <EmptyBox
              icon={<Inbox className="h-6 w-6 text-gray-400" />}
              title="Chưa có phiên nào"
              desc="Học viên sẽ xuất hiện ở đây ngay khi họ đặt lịch với bạn."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {queued.map((s) => (
                <QueueCard
                  key={s.id}
                  session={s}
                  starting={startingId === s.id}
                  onStart={() => handleStart(s.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* History */}
        <section>
          <SectionHeader
            title="Lịch sử gần đây"
            subtitle="10 phiên gần nhất — nhấn để xem chi tiết đánh giá"
            action={
              <button
                onClick={() => router.push('/expert/sessions')}
                className="text-[12.5px] font-semibold text-gray-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
              >
                Xem tất cả <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            }
          />

          {history.filter((s) => s.status !== 'QUEUED').length === 0 ? (
            <EmptyBox
              icon={<Clock3 className="h-6 w-6 text-gray-400" />}
              title="Chưa có lịch sử"
              desc="Các phiên đã chấm sẽ xuất hiện ở đây."
            />
          ) : (
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-white overflow-hidden">
              {history
                .filter((s) => s.status !== 'QUEUED')
                .slice(0, 10)
                .map((s) => (
                  <HistoryRow
                    key={s.id}
                    session={s}
                    onClick={() =>
                      (s.status === 'COMPLETED' || s.status === 'IN_PROGRESS') &&
                      router.push(`/expert/session/${s.id}`)
                    }
                  />
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  trailing,
  divider,
}: {
  label: string;
  value: string;
  trailing?: string;
  divider?: boolean;
}) {
  return (
    <div className={`px-5 py-4 ${divider ? 'border-l border-gray-200/80' : ''}`}>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</p>
      <p className="mt-1 text-[22px] font-bold text-gray-900 tabular-nums flex items-baseline gap-1">
        {value}
        {trailing && <span className="text-[14px]">{trailing}</span>}
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  count,
  action,
  accent,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  action?: React.ReactNode;
  accent?: 'live';
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">{title}</h2>
          {count !== undefined && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                accent === 'live' && count > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {count}
              {accent === 'live' && count > 0 && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            </span>
          )}
        </div>
        {subtitle && <p className="text-[12.5px] text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function QueueCard({
  session,
  starting,
  onStart,
}: {
  session: ScoringSession;
  starting: boolean;
  onStart: () => void;
}) {
  const tint = SKILL_TINT[session.skill] ?? SKILL_TINT.SPEAKING;
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200/80 p-4 hover:border-emerald-200 hover:shadow-[0_4px_20px_-6px_rgba(16,185,129,0.18)] transition-all">
      <div className="flex items-start gap-3">
        <div
          className={`h-10 w-10 rounded-xl ${tint.bg} flex items-center justify-center shrink-0 ring-1 ${tint.ring}`}
        >
          <span className={`text-[13px] font-bold ${tint.text}`}>#{session.id}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider ${tint.text}`}>
              {session.skill}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-[11px] text-gray-500">{relativeTime(session.createdAt)}</span>
          </div>
          <p className="text-[13.5px] font-semibold text-gray-800 mt-0.5 truncate">
            {session.userDisplayName ?? 'Học viên ẩn danh'}
          </p>
          {session.testTitle && (
            <p className="text-[11.5px] text-gray-500 truncate mt-0.5">{session.testTitle}</p>
          )}
        </div>

        <button
          onClick={onStart}
          disabled={starting}
          className="shrink-0 text-[12.5px] font-bold px-3.5 py-2 rounded-lg bg-gray-900 text-white hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
        >
          {starting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang nhận
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> Nhận phiên
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function HistoryRow({ session, onClick }: { session: ScoringSession; onClick: () => void }) {
  const tint = SKILL_TINT[session.skill] ?? SKILL_TINT.SPEAKING;
  const statusMap = {
    COMPLETED: { icon: CheckCircle2, text: 'Hoàn thành', cls: 'text-emerald-600' },
    CANCELLED: { icon: XCircle, text: 'Đã huỷ', cls: 'text-gray-400' },
    IN_PROGRESS: { icon: PlayCircle, text: 'Đang diễn ra', cls: 'text-blue-600' },
    QUEUED: { icon: Clock3, text: 'Chờ', cls: 'text-amber-600' },
  } as const;
  const st = statusMap[session.status];
  const clickable = session.status === 'COMPLETED' || session.status === 'IN_PROGRESS';

  return (
    <button
      onClick={onClick}
      disabled={!clickable}
      className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors ${
        clickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className={`h-1.5 w-1.5 rounded-full ${tint.dot} shrink-0`} />
      <span className="text-[12.5px] font-mono text-gray-400 w-10">#{session.id}</span>
      <span className={`text-[11px] font-bold uppercase tracking-wider ${tint.text} w-20`}>
        {session.skill}
      </span>
      <span className="flex-1 text-[13px] text-gray-700 truncate">
        {session.userDisplayName ?? 'Học viên'}
      </span>
      <span className={`text-[12px] font-semibold inline-flex items-center gap-1.5 ${st.cls}`}>
        <st.icon className="h-3.5 w-3.5" /> {st.text}
      </span>
      <span className="text-[11.5px] text-gray-400 w-28 text-right tabular-nums">
        {relativeTime(session.createdAt)}
      </span>
    </button>
  );
}

function EmptyBox({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 py-12 flex flex-col items-center justify-center text-center px-6">
      <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-[13.5px] font-bold text-gray-700">{title}</p>
      <p className="text-[12px] text-gray-500 mt-1 max-w-sm">{desc}</p>
    </div>
  );
}
