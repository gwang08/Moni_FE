'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Headphones, PenLine, Mic, Hourglass, Loader2, Check, Sparkles, UserCheck } from 'lucide-react';
import type { HistoryEntry, HistoryKind, HistoryStatus } from './use-unified-history';

interface Props {
  entry: HistoryEntry;
  onExpertScore?: (submissionId: number) => void;
}

const KIND_META: Record<HistoryKind, { label: string; tint: string; icon: React.ElementType }> = {
  writing: { label: 'Writing', tint: 'text-teal-700 bg-teal-50 border-teal-100', icon: PenLine },
  reading: { label: 'Reading', tint: 'text-blue-700 bg-blue-50 border-blue-100', icon: BookOpen },
  listening: { label: 'Listening', tint: 'text-violet-700 bg-violet-50 border-violet-100', icon: Headphones },
  speaking: { label: 'Speaking', tint: 'text-orange-700 bg-orange-50 border-orange-100', icon: Mic },
};

const STATUS_META: Record<HistoryStatus, { label: string; tint: string; stripe: string }> = {
  COMPLETED: { label: 'Đã chấm', tint: 'text-emerald-700 bg-emerald-50 border-emerald-100', stripe: 'stripe-teal' },
  PENDING: { label: 'Chưa chấm', tint: 'text-amber-700 bg-amber-50 border-amber-100', stripe: 'stripe-amber' },
  PROCESSING: { label: 'Đang chấm', tint: 'text-indigo-700 bg-indigo-50 border-indigo-100', stripe: 'stripe-indigo' },
  FAILED: { label: 'Lỗi', tint: 'text-rose-700 bg-rose-50 border-rose-100', stripe: 'stripe-rose' },
};

function bandBgText(band: number) {
  if (band >= 8) return 'bg-emerald-50 border-emerald-100 text-emerald-700';
  if (band >= 6.5) return 'bg-teal-50 border-teal-100 text-teal-700';
  if (band >= 5) return 'bg-amber-50 border-amber-100 text-amber-700';
  return 'bg-rose-50 border-rose-100 text-rose-700';
}

function stripeColor(status: HistoryStatus): string {
  if (status === 'COMPLETED') return 'bg-gradient-to-b from-teal-500 to-emerald-400';
  if (status === 'PROCESSING') return 'bg-gradient-to-b from-indigo-500 to-indigo-400';
  if (status === 'FAILED') return 'bg-gradient-to-b from-rose-500 to-rose-400';
  return 'bg-gradient-to-b from-amber-500 to-amber-400';
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

export function HistoryEntryCard({ entry, onExpertScore }: Props) {
  const router = useRouter();
  const kindMeta = KIND_META[entry.kind];
  const statusMeta = STATUS_META[entry.status];
  const KindIcon = kindMeta.icon;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex gap-4 relative overflow-hidden hover:shadow-md transition-all">
      <div className={`absolute top-0 left-0 h-full w-1.5 ${stripeColor(entry.status)}`} />

      <LeftIcon entry={entry} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Tag row */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-[10px] font-black border px-2 py-0.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1 ${kindMeta.tint}`}>
            <KindIcon className="h-2.5 w-2.5" />
            {kindMeta.label}
            {entry.tag && <span className="text-slate-400 font-semibold">· {entry.tag}</span>}
          </span>
          <span className={`text-[10px] font-black border px-2 py-0.5 rounded-full uppercase tracking-widest ${statusMeta.tint}`}>
            {statusMeta.label}
          </span>
        </div>

        <h3 className="text-[14.5px] font-extrabold text-slate-900 truncate">{entry.title}</h3>

        <div className="flex items-center gap-3 text-[11.5px] text-slate-500 font-semibold mt-1">
          {entry.subtitle && <span>{entry.subtitle}</span>}
          {entry.date && <span>{fmtDate(entry.date)}</span>}
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {entry.status === 'COMPLETED' && (
            <button
              onClick={() => router.push(entry.href)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-bold inline-flex items-center gap-1.5 hover:bg-slate-800"
            >
              Xem kết quả
            </button>
          )}
          {entry.status === 'PENDING' && entry.kind === 'writing' && (
            <>
              <button
                onClick={() => router.push(entry.href)}
                className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[12px] font-bold inline-flex items-center gap-1.5 hover:bg-teal-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Chấm bằng AI
              </button>
              {entry.writingSubmissionId && onExpertScore && (
                <button
                  onClick={() => onExpertScore(entry.writingSubmissionId!)}
                  className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-[12px] font-bold inline-flex items-center gap-1.5 hover:bg-orange-100"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Gửi Giảng viên
                </button>
              )}
            </>
          )}
          {entry.status === 'PROCESSING' && (
            <span className="text-[11.5px] font-bold text-indigo-700 inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang xử lý...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Ô icon/band 64×64 bên trái card
function LeftIcon({ entry }: { entry: HistoryEntry }) {
  if (entry.status === 'COMPLETED' && typeof entry.band === 'number' && entry.band > 0) {
    return (
      <div className={`relative w-16 h-16 rounded-2xl border grid place-items-center shrink-0 ${bandBgText(entry.band)}`}>
        <div className="text-center leading-none">
          <div className="text-[22px] font-black tabular-nums">{entry.band.toFixed(1)}</div>
          <div className="text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-80">BAND</div>
        </div>
      </div>
    );
  }
  if (entry.status === 'PROCESSING') {
    return (
      <div className="relative w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 grid place-items-center shrink-0">
        <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
      </div>
    );
  }
  if (entry.status === 'PENDING') {
    return (
      <div className="relative w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 grid place-items-center shrink-0">
        <Hourglass className="h-6 w-6 text-amber-600" />
      </div>
    );
  }
  if (entry.status === 'COMPLETED') {
    return (
      <div className="relative w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 grid place-items-center shrink-0">
        <Check className="h-6 w-6 text-emerald-600" />
      </div>
    );
  }
  return (
    <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 grid place-items-center shrink-0" />
  );
}
