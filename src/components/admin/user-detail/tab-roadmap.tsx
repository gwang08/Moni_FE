'use client';

import { CheckCircle2, Circle, Calendar, Target, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LearnerRoadmapInsights, WeeklyPlanResponse, WeeklyPlanSummary, DailySlotResponse, PerformanceVerdict } from '@/types/roadmap.types';

interface Props {
  insights: LearnerRoadmapInsights | null;
  weeklyPlan: WeeklyPlanResponse | null;
  history: WeeklyPlanSummary[];
}

const VERDICT_META: Record<PerformanceVerdict, { icon: typeof TrendingUp; label: string; cls: string }> = {
  IMPROVED: { icon: TrendingUp, label: 'Tiến bộ', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  STABLE: { icon: Minus, label: 'Ổn định', cls: 'bg-gray-50 text-gray-700 border-gray-200' },
  DECLINED: { icon: TrendingDown, label: 'Giảm', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
};

const SKILL_COLOR: Record<string, string> = {
  READING: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  LISTENING: 'text-gray-700 bg-gray-50 border-gray-200',
  WRITING: 'text-gray-700 bg-gray-50 border-gray-200',
  SPEAKING: 'text-gray-700 bg-gray-50 border-gray-200',
  VOCABULARY: 'text-gray-700 bg-gray-50 border-gray-200',
};

const DAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function TabRoadmap({ insights, weeklyPlan, history }: Props) {
  if (!insights && !weeklyPlan && history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
        Học viên này chưa có dữ liệu lộ trình.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Goal + Calibration */}
      {insights && (
        <div className="grid gap-4 md:grid-cols-3">
          <GoalCard insights={insights} />
          <CalibrationCard insights={insights} />
          <BandSkillCard insights={insights} />
        </div>
      )}

      {/* Warning */}
      {insights?.targetWarning && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>{insights.targetWarning}</div>
        </div>
      )}

      {/* Weekly plan */}
      {weeklyPlan && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">
              Tuần {weeklyPlan.weekNumber} — {formatDate(weeklyPlan.weekStartDate)} → {formatDate(weeklyPlan.weekEndDate)}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
              {weeklyPlan.status}
            </span>
          </div>
          <WeekSlots slots={weeklyPlan.slots} />
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Lịch sử tuần đã hoàn thành ({history.length})</h3>
          </div>
          <ul className="divide-y divide-gray-50">
            {history.map((w) => {
              const verdict = w.performanceVerdict as PerformanceVerdict | null;
              const meta = verdict ? VERDICT_META[verdict] : null;
              const Icon = meta?.icon;
              return (
                <li key={w.weekNumber} className="px-5 py-3 flex items-center gap-3 text-sm">
                  <div className="font-semibold text-gray-700 w-16">Tuần {w.weekNumber}</div>
                  <div className="flex-1 text-xs text-gray-500">
                    {formatDate(w.weekStartDate)} → {formatDate(w.weekEndDate)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Accuracy {w.weeklyAccuracy != null ? `${Math.round(w.weeklyAccuracy * 100)}%` : '—'}
                  </div>
                  <div className="text-xs text-gray-600">
                    Hoàn thành {w.completionRate != null ? `${Math.round(w.completionRate * 100)}%` : '—'}
                  </div>
                  {meta && Icon && (
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${meta.cls}`}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Weak + Strong tags */}
      {insights && (insights.weakestTags?.length || insights.strongestTags?.length) && (
        <div className="grid gap-4 md:grid-cols-2">
          <TagListCard title="Điểm yếu" tags={insights.weakestTags ?? []} variant="weak" />
          <TagListCard title="Điểm mạnh" tags={insights.strongestTags ?? []} variant="strong" />
        </div>
      )}
    </div>
  );
}

function GoalCard({ insights }: { insights: LearnerRoadmapInsights }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-gray-800">Mục tiêu</h3>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Target Overall</span>
          <span className="font-bold text-emerald-600 text-lg">
            {insights.targetOverall != null ? insights.targetOverall.toFixed(1) : '—'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Ngày thi</span>
          <span className="text-gray-700 font-medium flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(insights.examDate)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Còn lại</span>
          <span className="text-gray-700 font-medium">
            {insights.daysToExam != null ? `${insights.daysToExam} ngày` : '—'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Đạt được tối đa</span>
          <span className="text-gray-700 font-medium">
            {insights.achievableOverallByExam != null ? insights.achievableOverallByExam.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

function CalibrationCard({ insights }: { insights: LearnerRoadmapInsights }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Band hiện tại (calibrated)</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-emerald-600">
          {insights.calibratedOverall != null ? insights.calibratedOverall.toFixed(1) : '—'}
        </span>
        {insights.targetOverall != null && (
          <span className="text-xs text-gray-400">/ {insights.targetOverall.toFixed(1)}</span>
        )}
      </div>
      {insights.calibrationNote && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{insights.calibrationNote}</p>
      )}
    </div>
  );
}

function BandSkillCard({ insights }: { insights: LearnerRoadmapInsights }) {
  const rows: Array<{ label: string; cur: number | null; tgt: number | null }> = [
    { label: 'Reading', cur: insights.calibratedReading, tgt: insights.targetReading },
    { label: 'Listening', cur: insights.calibratedListening, tgt: insights.targetListening },
    { label: 'Writing', cur: insights.calibratedWriting, tgt: insights.targetWriting },
    { label: 'Speaking', cur: insights.calibratedSpeaking, tgt: insights.targetSpeaking },
  ];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Band theo kỹ năng</h3>
      <div className="space-y-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-gray-700">{r.label}</span>
            <span>
              <span className="font-bold text-gray-800">{r.cur != null ? r.cur.toFixed(1) : '—'}</span>
              {r.tgt != null && <span className="text-xs text-gray-400 ml-1">/ {r.tgt.toFixed(1)}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekSlots({ slots }: { slots: DailySlotResponse[] }) {
  const byDay = new Map<number, DailySlotResponse[]>();
  slots.forEach((s) => {
    const arr = byDay.get(s.dayOfWeek) ?? [];
    arr.push(s);
    byDay.set(s.dayOfWeek, arr);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const daySlots = byDay.get(d) ?? [];
        return (
          <div key={d} className="rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 min-h-[80px]">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">{DAY_LABEL[d]}</div>
            {daySlots.length === 0 ? (
              <div className="text-[10px] text-gray-300">—</div>
            ) : (
              <div className="space-y-1">
                {daySlots.map((s) => (
                  <div
                    key={s.id}
                    className={`px-1.5 py-1 rounded border text-[10px] ${SKILL_COLOR[s.skill] ?? SKILL_COLOR.READING}`}
                  >
                    <div className="flex items-center gap-1">
                      {s.status === 'DONE' ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Circle className="h-3 w-3 text-gray-300" />
                      )}
                      <span className="font-semibold truncate">{s.skill}</span>
                    </div>
                    {s.score != null && s.totalQuestions != null && s.totalQuestions > 0 && (
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {s.score}/{s.totalQuestions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TagListCard({
  title,
  tags,
  variant,
}: {
  title: string;
  tags: LearnerRoadmapInsights['weakestTags'];
  variant: 'weak' | 'strong';
}) {
  const list = (tags ?? []).slice(0, 8);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      {list.length === 0 ? (
        <p className="text-xs text-gray-400">Chưa có dữ liệu</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {list.map((t) => (
            <li key={t.tagId ?? t.tagName} className="flex items-center justify-between gap-2">
              <span className="text-gray-700 truncate">{t.tagName ?? t.tagCode ?? 'Tag'}</span>
              <span
                className={`font-semibold ${
                  variant === 'weak' ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {t.masteryLevel != null ? `${Math.round(t.masteryLevel * 100)}%` : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
