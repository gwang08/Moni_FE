'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles, Headphones, Award, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { getMySessions, getSessionEvaluation } from '@/lib/expert-api';
import type { ExpertEvaluation, ScoringSession } from '@/types/expert.types';

interface Props {
  params: Promise<{ sessionId: string }>;
}

const SPEAKING_CRITERIA: { key: keyof ExpertEvaluation; short: string; label: string }[] = [
  { key: 'fluency', short: 'FC', label: 'Fluency & Coherence' },
  { key: 'vocabulary', short: 'LR', label: 'Lexical Resource' },
  { key: 'grammar', short: 'GRA', label: 'Grammatical Range' },
  { key: 'pronunciation', short: 'PR', label: 'Pronunciation' },
];

function bandColor(b: number) {
  if (b >= 8) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-100' };
  if (b >= 6.5) return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-100' };
  if (b >= 5) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-100' };
  return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-100' };
}

function fmtDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// Parse compiled feedback back into general + per-criterion blocks
function parseFeedback(raw: string) {
  const general = raw.match(/\[NHẬN XÉT CHUNG\]\n([\s\S]*?)(?=\n\n\[ĐÁNH GIÁ CHI TIẾT\]|$)/);
  const detail = raw.split('[ĐÁNH GIÁ CHI TIẾT]')[1] ?? '';
  const perCrit: Record<string, string> = {};
  SPEAKING_CRITERIA.forEach(({ key, label }) => {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`- ${esc}[^\\n]*?:\\n([\\s\\S]*?)(?=\\n- |$)`);
    const m = detail.match(re);
    if (m?.[1] && m[1].trim() !== 'Không có nhận xét thêm') perCrit[key as string] = m[1].trim();
  });
  return { general: general?.[1]?.trim() || (detail ? '' : raw), perCrit };
}

export default function SpeakingResultPage({ params }: Props) {
  const { sessionId } = use(params);
  const sid = Number(sessionId);
  const router = useRouter();

  const [session, setSession] = useState<ScoringSession | null>(null);
  const [evaluation, setEvaluation] = useState<ExpertEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sessions, ev] = await Promise.all([
          getMySessions().catch(() => [] as ScoringSession[]),
          getSessionEvaluation(sid).catch(() => null),
        ]);
        const found = sessions.find((s) => s.id === sid) ?? null;
        setSession(found);
        setEvaluation(ev);
        if (!found && !ev) {
          toast.error('Không tìm thấy phiên');
          router.replace('/scoring-history');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [sid, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const overall = evaluation?.overallScore ?? 0;
  const overallTint = bandColor(overall);
  const { general, perCrit } = parseFeedback(evaluation?.feedback ?? '');

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAF9] pb-16">
      {/* Back */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Link
          href="/scoring-history"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại lịch sử chấm
        </Link>
      </div>

      {/* Hero: Overall band + expert */}
      <section className="max-w-5xl mx-auto px-4 pt-5">
        <div className="rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50 to-white border border-orange-100 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className={`relative w-32 h-32 md:w-36 md:h-36 rounded-[28px] ${overallTint.bg} ${overallTint.border} border-2 flex flex-col items-center justify-center shadow-sm ring-4 ${overallTint.ring} shrink-0`}>
              <span className={`text-[52px] md:text-[60px] font-black ${overallTint.text} tabular-nums leading-none`}>
                {evaluation ? overall.toFixed(1) : '—'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 mt-1">Band tổng</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 text-[10.5px] font-bold tracking-wider uppercase">
                  Speaking
                </Badge>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Phiên #{session?.id ?? sid}
                </span>
              </div>
              <h1 className="mt-2 text-[22px] md:text-[26px] font-bold text-gray-900 tracking-tight leading-tight">
                Kết quả đánh giá Speaking
              </h1>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px]">
                {evaluation?.expertName || session?.expertDisplayName ? (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center text-[13px]">👨‍🏫</div>
                    <div>
                      <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Giảng viên</p>
                      <p className="font-semibold text-gray-800">{evaluation?.expertName ?? session?.expertDisplayName}</p>
                    </div>
                  </div>
                ) : null}
                {(evaluation?.createdAt || session?.createdAt) && (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[13px]">📅</div>
                    <div>
                      <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Thời gian</p>
                      <p className="font-semibold text-gray-800">{fmtDate(evaluation?.createdAt ?? session?.createdAt)}</p>
                    </div>
                  </div>
                )}
                {session?.testTitle && (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[13px]">📚</div>
                    <div>
                      <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Bài thi</p>
                      <p className="font-semibold text-gray-800 truncate max-w-[240px]">{session.testTitle}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Criteria grid */}
      {evaluation && (
        <section className="max-w-5xl mx-auto px-4 mt-8">
          <SectionTitle icon={<Award className="h-4 w-4 text-orange-600" />} title="Đánh giá chi tiết" subtitle="Điểm từng tiêu chí IELTS Speaking" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {SPEAKING_CRITERIA.map((c) => {
              const band = Number(evaluation[c.key] ?? 0);
              const tint = bandColor(band);
              const note = perCrit[c.key as string];
              return (
                <div
                  key={c.key as string}
                  className={`group relative rounded-3xl border bg-white p-5 shadow-sm hover:shadow-md transition-all ${tint.border}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-16 w-16 rounded-2xl ${tint.bg} border ${tint.border} flex flex-col items-center justify-center shrink-0`}>
                      <span className={`text-[22px] font-black ${tint.text} leading-none`}>{band.toFixed(1)}</span>
                      <span className={`text-[9px] font-bold ${tint.text} uppercase tracking-wider mt-0.5`}>Band</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10.5px] font-bold tracking-wider uppercase ${tint.bg} ${tint.text} ${tint.border}`}>
                          {c.short}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[14.5px] font-bold text-gray-900">{c.label}</p>
                      {note ? (
                        <p className="mt-2 text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{note}</p>
                      ) : (
                        <p className="mt-2 text-[12px] italic text-gray-400">Không có nhận xét riêng cho tiêu chí này</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* General feedback */}
      {general && (
        <section className="max-w-5xl mx-auto px-4 mt-8">
          <SectionTitle icon={<Sparkles className="h-4 w-4 text-orange-600" />} title="Nhận xét tổng quan" subtitle="Đánh giá từ giảng viên" />
          <div className="mt-4 rounded-3xl bg-white border border-gray-200/80 p-6 shadow-sm">
            <p className="text-[14px] text-gray-700 leading-[1.8] whitespace-pre-wrap">{general}</p>
          </div>
        </section>
      )}

      {/* Strengths & improvements */}
      {(evaluation?.strengths || evaluation?.areasForImprovement) && (
        <section className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {evaluation?.strengths && (
            <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">✨</div>
                <h3 className="text-[15px] font-bold text-emerald-800">Điểm mạnh</h3>
              </div>
              <p className="text-[13.5px] text-emerald-900/90 leading-relaxed whitespace-pre-wrap">{evaluation.strengths}</p>
            </div>
          )}
          {evaluation?.areasForImprovement && (
            <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 to-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center">💡</div>
                <h3 className="text-[15px] font-bold text-amber-800">Cần cải thiện</h3>
              </div>
              <p className="text-[13.5px] text-amber-900/90 leading-relaxed whitespace-pre-wrap">{evaluation.areasForImprovement}</p>
            </div>
          )}
        </section>
      )}

      {/* Recordings */}
      {(session?.recordingUrl || session?.expertRecordingUrl) && (
        <section className="max-w-5xl mx-auto px-4 mt-8">
          <SectionTitle icon={<Headphones className="h-4 w-4 text-orange-600" />} title="Bản ghi phiên" subtitle="Nghe lại cuộc hội thoại với giảng viên" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {session.recordingUrl && (
              <RecordingCard label="Bạn" emoji="🎙️" src={session.recordingUrl} tint="blue" />
            )}
            {session.expertRecordingUrl && (
              <RecordingCard label="Giảng viên" emoji="🎧" src={session.expertRecordingUrl} tint="orange" />
            )}
          </div>
        </section>
      )}

      {/* No evaluation fallback */}
      {!evaluation && !loading && (
        <section className="max-w-5xl mx-auto px-4 mt-8">
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white/60 p-12 text-center">
            <p className="text-[15px] font-bold text-gray-700">Chưa có đánh giá</p>
            <p className="text-[13px] text-gray-500 mt-1">Phiên này chưa được giảng viên chấm. Vui lòng quay lại sau.</p>
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-4 mt-10 flex justify-end">
        <Link
          href="/scoring-history"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          Quay lại danh sách <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function RecordingCard({ label, emoji, src, tint }: { label: string; emoji: string; src: string; tint: 'blue' | 'orange' }) {
  const cls = tint === 'blue'
    ? { ring: 'border-blue-200', chip: 'bg-blue-50 text-blue-700' }
    : { ring: 'border-orange-200', chip: 'bg-orange-50 text-orange-700' };
  return (
    <div className={`rounded-3xl bg-white border ${cls.ring} p-5 shadow-sm`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[18px]">{emoji}</span>
        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls.chip}`}>{label}</span>
      </div>
      <audio controls src={src} className="w-full" />
    </div>
  );
}
