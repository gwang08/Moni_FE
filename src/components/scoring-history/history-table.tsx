'use client';

import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  Loader2,
  Sparkles,
  UserCheck,
  ArrowRight,
  X,
} from 'lucide-react';
import type { HistoryEntry, HistoryKind, HistoryStatus } from './use-unified-history';

interface Props {
  entries: HistoryEntry[];
  onExpertScore?: (submissionId: number) => void;
  onCancelExpert?: (submissionId: number) => void;
}

const KIND_META: Record<HistoryKind, { label: string; tint: string; icon: React.ElementType }> = {
  writing: { label: 'Writing', tint: 'text-teal-700 bg-teal-50 border-teal-100', icon: PenLine },
  reading: { label: 'Reading', tint: 'text-blue-700 bg-blue-50 border-blue-100', icon: BookOpen },
  listening: { label: 'Listening', tint: 'text-violet-700 bg-violet-50 border-violet-100', icon: Headphones },
  speaking: { label: 'Speaking', tint: 'text-orange-700 bg-orange-50 border-orange-100', icon: Mic },
};

const STATUS_META: Record<HistoryStatus, { label: string; tint: string }> = {
  COMPLETED: { label: 'Đã chấm', tint: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
  PENDING: { label: 'Chưa chấm', tint: 'text-amber-700 bg-amber-50 border-amber-100' },
  PROCESSING: { label: 'Đang chấm', tint: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
  FAILED: { label: 'Lỗi', tint: 'text-rose-700 bg-rose-50 border-rose-100' },
  CANCELLED: { label: 'Đã huỷ', tint: 'text-slate-600 bg-slate-100 border-slate-200' },
};

function bandClass(b: number) {
  if (b >= 8) return 'text-emerald-700';
  if (b >= 6.5) return 'text-teal-700';
  if (b >= 5) return 'text-amber-600';
  return 'text-rose-600';
}
function bandBar(b: number) {
  if (b >= 8) return 'from-emerald-500 to-emerald-400';
  if (b >= 6.5) return 'from-teal-500 to-emerald-400';
  if (b >= 5) return 'from-amber-500 to-yellow-400';
  return 'from-rose-500 to-rose-400';
}

function fmtDate(d: string) {
  if (!d) return '';
  const iso = d.includes('Z') || d.includes('+') ? d : d + 'Z';
  return new Date(iso).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Layout cột cho desktop table — 1 bài = 1 dòng, tất cả nowrap
const COLS = 'grid-cols-[96px_1fr_130px_112px_128px_224px]';

export function HistoryTable({ entries, onExpertScore, onCancelExpert }: Props) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <div
        className={`hidden md:grid ${COLS} gap-3 px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 text-[10.5px] font-black text-slate-500 uppercase tracking-widest`}
      >
        <div>Kỹ năng</div>
        <div>Tiêu đề · Chi tiết</div>
        <div>Band</div>
        <div>Trạng thái</div>
        <div>Nộp lúc</div>
        <div className="text-right">Thao tác</div>
      </div>

      <div className="divide-y divide-slate-100">
        {entries.map((e) => (
          <HistoryRow key={e.id} entry={e} onExpertScore={onExpertScore} onCancelExpert={onCancelExpert} />
        ))}
      </div>
    </div>
  );
}

function HistoryRow({ entry, onExpertScore, onCancelExpert }: { entry: HistoryEntry; onExpertScore?: (id: number) => void; onCancelExpert?: (id: number) => void }) {
  const router = useRouter();
  const km = KIND_META[entry.kind];
  const sm = STATUS_META[entry.status];
  const KindIcon = km.icon;

  const rowBg =
    entry.status === 'PENDING'
      ? 'bg-amber-50/20 hover:bg-amber-50/40'
      : entry.status === 'PROCESSING'
        ? 'bg-indigo-50/20 hover:bg-indigo-50/40'
        : 'hover:bg-slate-50/50';

  return (
    <div className={`${rowBg} transition-colors`}>
      {/* Desktop table row — nowrap toàn bộ để 1 bài = 1 dòng */}
      <div className={`hidden md:grid ${COLS} gap-3 px-4 py-3 items-center`}>
        <span
          className={`text-[10.5px] font-black border px-2 py-0.5 rounded-full uppercase tracking-widest w-fit inline-flex items-center gap-1 whitespace-nowrap ${km.tint}`}
        >
          <KindIcon className="h-2.5 w-2.5" />
          {km.label}
        </span>

        {/* Title + meta inline — truncate để không xuống dòng */}
        <div className="min-w-0 flex items-baseline gap-2">
          <span className="text-[13px] font-bold text-slate-900 truncate">{entry.title}</span>
          {entry.subtitle && (
            <span className="text-[11px] text-slate-400 font-semibold tabular-nums whitespace-nowrap shrink-0">
              · {entry.subtitle}
            </span>
          )}
        </div>

        <BandCell band={entry.band} status={entry.status} />

        <span className={`text-[10.5px] font-black border px-2 py-0.5 rounded-full uppercase tracking-widest w-fit whitespace-nowrap ${sm.tint}`}>
          {entry.status === 'PROCESSING' && <span className="inline-block h-1.5 w-1.5 bg-indigo-500 rounded-full mr-1 align-middle animate-pulse" />}
          {sm.label}
        </span>

        <span className="text-[11.5px] text-slate-500 font-semibold tabular-nums whitespace-nowrap">{fmtDate(entry.date)}</span>

        <ActionsCell entry={entry} onExpertScore={onExpertScore} onCancelExpert={onCancelExpert} router={router} align="end" />
      </div>

      {/* Mobile card fallback */}
      <div className="md:hidden p-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10.5px] font-black border px-2 py-0.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1 ${km.tint}`}>
            <KindIcon className="h-2.5 w-2.5" />
            {km.label}
            {entry.tag && <span className="text-slate-400 font-semibold">· {entry.tag}</span>}
          </span>
          <span className={`text-[10.5px] font-black border px-2 py-0.5 rounded-full uppercase tracking-widest ${sm.tint}`}>
            {sm.label}
          </span>
          <BandCell band={entry.band} status={entry.status} compact />
        </div>
        <div className="text-[13.5px] font-bold text-slate-900">{entry.title}</div>
        <div className="text-[11.5px] text-slate-500 font-semibold flex items-center gap-2 flex-wrap">
          {entry.subtitle && <span>{entry.subtitle}</span>}
          <span>·</span>
          <span className="tabular-nums">{fmtDate(entry.date)}</span>
        </div>
        <ActionsCell entry={entry} onExpertScore={onExpertScore} onCancelExpert={onCancelExpert} router={router} align="start" />
      </div>
    </div>
  );
}

function BandCell({
  band,
  status,
  compact,
}: {
  band?: number;
  status: HistoryStatus;
  compact?: boolean;
}) {
  if (status === 'PROCESSING') {
    return (
      <span className="text-[12px] text-indigo-500 font-bold inline-flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Đang chấm
      </span>
    );
  }
  if (typeof band !== 'number' || band <= 0) {
    return <span className="text-slate-300 tabular-nums text-[13px]">—</span>;
  }
  if (compact) {
    return (
      <span className={`text-[13px] font-black tabular-nums ${bandClass(band)}`}>
        Band {band.toFixed(1)}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[14px] font-black tabular-nums ${bandClass(band)}`}>{band.toFixed(1)}</span>
      <div className="h-1 w-14 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${bandBar(band)}`}
          style={{ width: `${Math.min(100, (band / 9) * 100)}%` }}
        />
      </div>
    </div>
  );
}

// Actions: luôn hiện, không ẩn theo hover. Label tiếng Việt đầy đủ.
function ActionsCell({
  entry,
  onExpertScore,
  onCancelExpert,
  router,
  align,
}: {
  entry: HistoryEntry;
  onExpertScore?: (id: number) => void;
  onCancelExpert?: (id: number) => void;
  router: ReturnType<typeof useRouter>;
  align: 'start' | 'end';
}) {
  const justify = align === 'end' ? 'justify-end' : 'justify-start';

  if (entry.status === 'COMPLETED') {
    return (
      <div className={`flex gap-1.5 ${justify}`}>
        <button
          onClick={() => router.push(entry.href)}
          className="px-2.5 py-1.5 rounded-md bg-slate-900 text-white text-[11.5px] font-bold inline-flex items-center gap-1 hover:bg-slate-800"
        >
          Xem kết quả
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  if (entry.status === 'PENDING' && entry.kind === 'writing') {
    return (
      <div className={`flex gap-1.5 ${justify} flex-nowrap whitespace-nowrap`}>
        <button
          onClick={() => router.push(entry.href)}
          className="px-2.5 py-1.5 rounded-md bg-teal-600 text-white text-[11.5px] font-bold inline-flex items-center gap-1 hover:bg-teal-700 shrink-0"
          title="Chấm bài tự động bằng AI"
        >
          <Sparkles className="h-3 w-3" />
          Chấm AI
        </button>
        {entry.writingSubmissionId && onExpertScore && (
          <button
            onClick={() => onExpertScore(entry.writingSubmissionId!)}
            className="px-2.5 py-1.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[11.5px] font-bold inline-flex items-center gap-1 hover:bg-orange-100 shrink-0"
            title="Gửi cho giảng viên chấm"
          >
            <UserCheck className="h-3 w-3" />
            Gửi GV
          </button>
        )}
      </div>
    );
  }

  if (entry.status === 'PROCESSING') {
    // Chỉ cho huỷ khi session vẫn QUEUED (giảng viên chưa nhận).
    // Khi giảng viên đã nhận → status = IN_PROGRESS → backend sẽ reject, ẩn nút luôn cho UX rõ ràng.
    const canCancel =
      entry.kind === 'writing'
      && !!entry.writingSubmissionId
      && !!onCancelExpert
      && entry.scoringSessionStatus === 'QUEUED';
    return (
      <div className={`flex gap-1.5 items-center ${justify}`}>
        <span className="text-[11px] text-slate-400 font-bold">Chờ kết quả…</span>
        {canCancel ? (
          <button
            onClick={() => onCancelExpert!(entry.writingSubmissionId!)}
            className="px-2 py-1 rounded-md text-rose-600 border border-rose-200 bg-rose-50 text-[11.5px] font-bold inline-flex items-center gap-1 hover:bg-rose-100"
            title="Huỷ & chọn giảng viên khác (chỉ được nếu giảng viên chưa nhận)"
          >
            <X className="h-3 w-3" />
            Huỷ
          </button>
        ) : entry.kind === 'writing' && entry.scoringSessionStatus === 'IN_PROGRESS' ? (
          <span className="text-[10.5px] text-slate-500 italic">Giảng viên đang chấm</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`flex ${justify}`}>
      <span className="text-[11px] text-slate-300 font-bold">—</span>
    </div>
  );
}
