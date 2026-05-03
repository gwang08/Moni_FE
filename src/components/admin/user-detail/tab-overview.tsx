'use client';

import Link from 'next/link';
import { BookOpen, Headphones, Pencil, Mic, Bot, GraduationCap, Clock, ChevronRight } from 'lucide-react';
import type { AttemptHistory } from '@/lib/practice-api';
import type { WritingSubmission } from '@/lib/ai-api';
import type { ScoringSession } from '@/types/expert.types';
import type { LearnerRoadmapInsights, WeeklyPlanResponse } from '@/types/roadmap.types';
import { ActivitySparkline } from './activity-sparkline';
import { SkillBreakdown } from './skill-breakdown';

interface Props {
  attempts: AttemptHistory[];
  writing: WritingSubmission[];
  sessions: ScoringSession[];
  insights: LearnerRoadmapInsights | null;
  weeklyPlan: WeeklyPlanResponse | null;
}

const SKILL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  READING: BookOpen,
  LISTENING: Headphones,
  WRITING: Pencil,
  SPEAKING: Mic,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Entry {
  key: string;
  date: string;
  title: string;
  skill: string;
  source: 'ai' | 'expert' | 'practice';
  score?: string;
  duration?: string;
}

function buildRecentEntries(
  attempts: AttemptHistory[],
  writing: WritingSubmission[],
  sessions: ScoringSession[],
): Entry[] {
  const entries: Entry[] = [];

  attempts.forEach((a) => {
    const dt = a.submittedAt ?? a.startedAt;
    if (!dt) return;
    entries.push({
      key: `a-${a.attemptId}`,
      date: dt,
      title: a.testTitle ?? a.stimulusTitle ?? 'Bài tập',
      skill: a.skill ?? 'READING',
      source: 'practice',
      score: a.totalQuestions > 0 ? `${a.score}/${a.totalQuestions}` : undefined,
      duration: a.elapsedSeconds > 0 ? formatDuration(a.elapsedSeconds) : undefined,
    });
  });

  writing.forEach((w) => {
    entries.push({
      key: `w-${w.submissionId}`,
      date: w.submittedAt,
      title: w.testTitle ?? w.stimulusTitle ?? `Writing ${w.taskType === 'TASK_1' ? 'Task 1' : 'Task 2'}`,
      skill: 'WRITING',
      source: 'ai',
      score: w.overallBand != null ? `Band ${w.overallBand.toFixed(1)}` : undefined,
    });
  });

  sessions.forEach((s) => {
    const dt = s.createdAt ?? s.submittedAt;
    if (!dt) return;
    entries.push({
      key: `s-${s.id}`,
      date: dt,
      title: s.testTitle ?? s.stimulusTitle ?? `Phiên #${s.id}`,
      skill: s.skill,
      source: 'expert',
    });
  });

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return entries.slice(0, 5);
}

export function TabOverview({ attempts, writing, sessions, insights, weeklyPlan }: Props) {
  const recent = buildRecentEntries(attempts, writing, sessions);
  const activityDates = [
    ...attempts.map((a) => a.submittedAt ?? a.startedAt).filter(Boolean) as string[],
    ...writing.map((w) => w.submittedAt),
    ...sessions.map((s) => s.createdAt ?? s.submittedAt).filter(Boolean) as string[],
  ];

  const weekProgress = weeklyPlan
    ? Math.round(
        (weeklyPlan.slots.filter((s) => s.status === 'DONE').length / Math.max(1, weeklyPlan.slots.length)) * 100,
      )
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2 space-y-4">
        <ActivitySparkline dates={activityDates} />
        <SkillBreakdown attempts={attempts} writing={writing} sessions={sessions} />

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Bài làm gần đây</h3>
            <span className="text-xs text-gray-400">{recent.length}/{attempts.length + writing.length + sessions.length}</span>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Chưa có hoạt động nào</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recent.map((e) => {
                const Icon = SKILL_ICON[e.skill] ?? BookOpen;
                return (
                  <li key={e.key} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50">
                    <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800 truncate">{e.title}</span>
                        {e.source === 'ai' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            <Bot className="h-2.5 w-2.5" />AI
                          </span>
                        )}
                        {e.source === 'expert' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <GraduationCap className="h-2.5 w-2.5" />Expert
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                        <span>{formatDate(e.date)}</span>
                        {e.duration && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {e.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    {e.score && (
                      <span className="text-sm font-semibold text-emerald-600 shrink-0">{e.score}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Lộ trình tuần này</h3>
          {weeklyPlan ? (
            <>
              <div className="text-xs text-gray-500 mb-2">
                Tuần {weeklyPlan.weekNumber} · {weeklyPlan.weekStartDate} → {weeklyPlan.weekEndDate}
              </div>
              <div className="text-xs text-gray-500 mb-1 flex justify-between">
                <span>Hoàn thành</span>
                <span className="font-bold text-emerald-600">{weekProgress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${weekProgress}%` }} />
              </div>
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <Row label="Accuracy" value={weeklyPlan.weeklyAccuracy != null ? `${Math.round(weeklyPlan.weeklyAccuracy * 100)}%` : '—'} />
                <Row label="Verdict" value={weeklyPlan.performanceVerdict ?? '—'} />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Học viên chưa có weekly plan.</p>
          )}
        </div>

        {insights && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Chỉ số học tập</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <Row label="Band calibrated" value={insights.calibratedOverall != null ? insights.calibratedOverall.toFixed(1) : '—'} accent />
              <Row label="Mastery" value={insights.masteryIndex != null ? `${Math.round(insights.masteryIndex * 100)}%` : '—'} />
              <Row label="Confidence" value={insights.confidenceIndex != null ? `${Math.round(insights.confidenceIndex * 100)}%` : '—'} />
              <Row label="Ngày đến kỳ thi" value={insights.daysToExam != null ? `${insights.daysToExam} ngày` : '—'} />
              {insights.targetWarning && (
                <div className="mt-2 px-2 py-1.5 rounded-md bg-amber-50 border border-amber-100 text-[11px] text-amber-800">
                  {insights.targetWarning}
                </div>
              )}
            </div>
          </div>
        )}

        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
        >
          Xem thêm học viên khác
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${accent ? 'text-emerald-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}
