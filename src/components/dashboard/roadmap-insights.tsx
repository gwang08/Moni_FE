'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, TriangleAlert, Info } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { getRoadmapInsights } from '@/lib/roadmap-api';
import type { LearnerRoadmapInsights, LearnerTagMetric } from '@/types/roadmap.types';

function fmtBand(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val) || val <= 0) return '—';
  return val.toFixed(1);
}

function fmtPct01(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val)) return '—';
  const pct = Math.max(0, Math.min(1, val)) * 100;
  return `${Math.round(pct)}%`;
}

function fmtDateYmd(date: string | null | undefined): string {
  if (!date) return '—';
  // Accept either YYYY-MM-DD or full ISO and return YYYY-MM-DD.
  return date.split('T')[0] ?? '—';
}

function clamp01(val: number | null | undefined): number {
  if (val == null || Number.isNaN(val) || !Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(1, val));
}

function MetricBar({
  label,
  value01,
  accent,
}: {
  label: string;
  value01: number | null | undefined;
  accent: 'amber' | 'sky' | 'emerald';
}) {
  const v = clamp01(value01);
  const bar =
    accent === 'sky'
      ? 'from-sky-500 to-indigo-500'
      : accent === 'emerald'
        ? 'from-emerald-500 to-lime-500'
        : 'from-amber-500 to-rose-500';
  const glow =
    accent === 'sky'
      ? 'shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_10px_30px_-14px_rgba(59,130,246,0.45)]'
      : accent === 'emerald'
        ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_10px_30px_-14px_rgba(34,197,94,0.40)]'
        : 'shadow-[0_0_0_1px_rgba(245,158,11,0.25),0_10px_30px_-14px_rgba(244,63,94,0.40)]';

  return (
    <div className="rounded-xl border border-gray-100 bg-white/70 backdrop-blur px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <div className="text-xs font-semibold text-gray-700 font-mono">{fmtPct01(value01)}</div>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${bar} ${glow} transition-all duration-700`}
          style={{ width: `${Math.round(v * 100)}%` }}
        />
      </div>
    </div>
  );
}

function TagRow({ m }: { m: LearnerTagMetric }) {
  const mastery = clamp01(m.masteryLevel);
  const conf = clamp01(m.confidenceScore);
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-800 truncate">
            {m.tagName || m.tagCode || 'Unknown tag'}
          </div>
          <div className="text-[11px] text-gray-400">
            {m.tagType || 'TAG'} {m.updatedAt ? `• ${fmtDateYmd(m.updatedAt)}` : ''}
          </div>
        </div>
        <div className="flex-shrink-0 text-right font-mono">
          <div className="text-[11px] text-gray-500">M {Math.round(mastery * 100)}%</div>
          <div className="text-[11px] text-gray-500">C {Math.round(conf * 100)}%</div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${Math.round(mastery * 100)}%` }} />
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500" style={{ width: `${Math.round(conf * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

type BandRow = {
  label: string;
  placement: number | null;
  calibrated: number | null;
  target: number | null;
};

export function RoadmapInsights() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<LearnerRoadmapInsights | null>(null);
  const fetchedRef = useRef(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await getRoadmapInsights();
      setInsights(data);
    } catch {
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchInsights();
  }, []);

  useEffect(() => {
    const handler = () => fetchInsights();
    window.addEventListener('roadmap-updated', handler);
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener('roadmap-updated', handler);
      window.removeEventListener('focus', handler);
    };
  }, []);

  const rows: BandRow[] = useMemo(() => {
    if (!insights) return [];
    return [
      {
        label: 'Overall',
        placement: insights.placementOverall ?? null,
        calibrated: insights.calibratedOverall ?? null,
        target: insights.targetOverall ?? null,
      },
      {
        label: 'Reading',
        placement: insights.placementReading ?? null,
        calibrated: insights.calibratedReading ?? null,
        target: insights.targetReading ?? null,
      },
      {
        label: 'Listening',
        placement: insights.placementListening ?? null,
        calibrated: insights.calibratedListening ?? null,
        target: insights.targetListening ?? null,
      },
      {
        label: 'Writing',
        placement: insights.placementWriting ?? null,
        calibrated: insights.calibratedWriting ?? null,
        target: insights.targetWriting ?? null,
      },
      {
        label: 'Speaking',
        placement: insights.placementSpeaking ?? null,
        calibrated: insights.calibratedSpeaking ?? null,
        target: insights.targetSpeaking ?? null,
      },
    ];
  }, [insights]);

  if (loading) return <SkeletonCard className="h-80" />;
  if (!insights) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-gray-500" />
          <div className="text-base font-semibold text-gray-800">Personalized Roadmap</div>
        </div>
        <div className="text-sm text-gray-500">
          Khong the tai bang chi so luc nay. Thu tai lai trang hoac lam moi dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="relative bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(244,63,94,0.12),transparent_35%),radial-gradient(circle_at_40%_90%,rgba(16,185,129,0.10),transparent_40%)] px-6 py-5">
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="h-full w-full bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:22px_22px]" />
        </div>
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white/70 border border-white/60 backdrop-blur">
                <Activity className="h-5 w-5 text-gray-700" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">Personalized Roadmap</h2>
                <p className="text-xs text-gray-500">
                  Bang chi so chi tiet: tu danh gia, he thong hieu chinh, va khoang cach toi muc tieu.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <div className="text-[11px] text-gray-500">Exam</div>
            <div className="text-sm font-semibold text-gray-800 font-mono">
              {fmtDateYmd(insights.examDate)}
              {insights.daysToExam != null ? ` • D-${insights.daysToExam}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white px-6 py-5 space-y-5">
        {insights?.targetOverAmbitious && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
            <TriangleAlert className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-amber-800">Muc tieu co the hoi qua tam</div>
              <div className="text-sm text-amber-700 leading-relaxed">
                {insights.targetWarning ||
                  'Hay can nhac giam muc tieu, hoac tang tan suat luyen tap truoc ngay thi.'}
              </div>
              {insights.achievableOverallByExam != null && (
                <div className="text-xs text-amber-700 mt-1">
                  Uoc tinh bao thu: overall co the dat toi khoang <span className="font-mono font-semibold">{fmtBand(insights.achievableOverallByExam)}</span> toi ngay thi.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <MetricBar label="Mastery index (0..1)" value01={insights.masteryIndex} accent="sky" />
          <MetricBar label="Confidence index (0..1)" value01={insights.confidenceIndex} accent="amber" />
        </div>

        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-800">Band board</div>
              <div className="text-[11px] text-gray-500">
              {insights.placementCompletedAt ? `Placement: ${fmtDateYmd(insights.placementCompletedAt)}` : ''}
              {insights.lastMetricUpdatedAt ? ` • Metrics: ${fmtDateYmd(insights.lastMetricUpdatedAt)}` : ''}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs text-gray-500 bg-white">
                <tr className="border-t border-gray-100">
                  <th className="text-left font-medium px-4 py-2">Skill</th>
                  <th className="text-right font-medium px-4 py-2">
                    {insights.placementSelfAssessed ? 'Self/Placement' : 'Placement'}
                  </th>
                  <th className="text-right font-medium px-4 py-2">Calibrated</th>
                  <th className="text-right font-medium px-4 py-2">Target</th>
                  <th className="text-right font-medium px-4 py-2">Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => {
                  const gap =
                    r.target != null && r.target > 0 && r.calibrated != null && r.calibrated > 0
                      ? Math.round((r.target - r.calibrated) * 2) / 2
                      : null;
                  const gapClass =
                    gap == null
                      ? 'text-gray-400'
                      : gap <= 0
                        ? 'text-emerald-600'
                        : gap <= 1.0
                          ? 'text-amber-600'
                          : 'text-rose-600';

                  return (
                    <tr key={r.label} className={r.label === 'Overall' ? 'bg-gray-50/40' : 'bg-white'}>
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{r.label}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-600">{fmtBand(r.placement)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-800">{fmtBand(r.calibrated)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-600">{fmtBand(r.target)}</td>
                      <td className={`px-4 py-2.5 text-right font-mono font-semibold ${gapClass}`}>
                        {gap == null ? '—' : `${gap > 0 ? '+' : ''}${gap.toFixed(1)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!!insights?.calibrationNote && (
            <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-start gap-2">
              <Info className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="text-xs text-gray-600 leading-relaxed">{insights.calibrationNote}</div>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-800">Weakest focus (tags)</div>
            <div className="space-y-2">
              {(insights?.weakestTags ?? []).slice(0, 5).map((m, idx) => (
                <TagRow key={`${m.tagId ?? 'x'}-${idx}`} m={m} />
              ))}
              {(insights?.weakestTags ?? []).length === 0 && (
                <div className="text-sm text-gray-400 rounded-lg border border-dashed border-gray-200 px-3 py-2">
                  Chua co du lieu tag. Hay lam them bai luyen tap de he thong do duoc diem yeu.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-800">Strongest (tags)</div>
            <div className="space-y-2">
              {(insights?.strongestTags ?? []).slice(0, 5).map((m, idx) => (
                <TagRow key={`${m.tagId ?? 'x'}-${idx}`} m={m} />
              ))}
              {(insights?.strongestTags ?? []).length === 0 && (
                <div className="text-sm text-gray-400 rounded-lg border border-dashed border-gray-200 px-3 py-2">
                  Chua co du lieu tag.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
