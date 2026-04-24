'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ChevronLeft, ChevronRight, Sparkles, Map } from 'lucide-react';
import { ChibiMascot } from '@/components/ui/chibi-mascot';
import { useHydration } from '@/hooks/use-hydration';
import { SkeletonCard } from '@/components/ui/skeleton';
import { TargetScores } from '@/components/dashboard/target-scores';
import { ExamCountdown } from '@/components/dashboard/exam-countdown';
import { StudyProgress } from '@/components/dashboard/study-progress';
import { VocabReviewStats } from '@/components/dashboard/vocab-review-stats';
import { WeeklyStats } from '@/components/dashboard/weekly-stats';
import { useAuthStore } from '@/store/auth-store';
import { PlacementDialog, PLACEMENT_SKIP_KEY } from '@/components/dashboard/placement-dialog';
import { LearningRoadmap } from '@/components/dashboard/learning-roadmap';
import { RoadmapInsights } from '@/components/dashboard/roadmap-insights';
import { useUserStore } from '@/store/user-store';
import { useTourStore } from '@/store/tour-store';
import { getPlacementResult } from '@/lib/placement-api';
import { getWeeklyPlan, getWeeklyPlanHistory, getLearnMetricStatus } from '@/lib/roadmap-api';
import { getRoadmapSubscriptionStatus } from '@/lib/subscription-api';
import { apiClient } from '@/lib/api-client';
import { RoadmapPaywall } from '@/components/dashboard/roadmap-paywall';
import { RoadmapReturningDialog } from '@/components/dashboard/roadmap-returning-dialog';
import type { ApiResponse } from '@/types/auth.types';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonCard className="h-44 rounded-3xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard className="h-80 rounded-3xl" />
        <SkeletonCard className="h-80 rounded-3xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <SkeletonCard className="lg:col-span-8 h-72 rounded-3xl" />
        <SkeletonCard className="lg:col-span-4 h-72 rounded-3xl" />
      </div>
      <SkeletonCard className="h-48 rounded-3xl" />
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useHydration();
  const userRole = useAuthStore((state) => state.user?.role);
  const userName = useAuthStore((state) => state.user?.fullName);
  const setPlacementResult = useUserStore((s) => s.setPlacementResult);
  const setTargetScore = useUserStore((s) => s.setTargetScore);
  const setExamDate = useUserStore((s) => s.setExamDate);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { step: tourStep, setStep: setTourStep } = useTourStore();
  const [showPlacementDialog, setShowPlacementDialog] = useState(false);
  const fetchedRef = useRef(false);

  const [availableWeeks, setAvailableWeeks] = useState<{ week: number, label: string, isCurrent: boolean }[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(undefined);
  const [hasRoadmapSub, setHasRoadmapSub] = useState<boolean | null>(null);
  const [showReturningDialog, setShowReturningDialog] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (userRole === 'ADMIN') { router.replace('/admin'); return; }
    if (userRole === 'EXPERT') { router.replace('/expert/dashboard'); return; }
  }, [hydrated, userRole, router]);

  useEffect(() => {
    if (!hydrated || fetchedRef.current) return;
    fetchedRef.current = true;

    async function loadWeeks() {
      try {
        const roadmapStatus = await getRoadmapSubscriptionStatus();
        setHasRoadmapSub(roadmapStatus.hasActiveSubscription);
        if (!roadmapStatus.hasActiveSubscription) return;

        const [currentPlan, history, metricStatus] = await Promise.all([
          getWeeklyPlan().catch(() => null),
          getWeeklyPlanHistory().catch(() => []),
          getLearnMetricStatus().catch(() => ({ hasExistingMetrics: false, hasPlacementResult: false })),
        ]);

        if (!currentPlan && metricStatus.hasExistingMetrics && history.length > 0) {
          setShowReturningDialog(true);
          return;
        }

        const weeks = [];
        if (currentPlan) weeks.push({ week: currentPlan.weekNumber, label: `Tuần ${currentPlan.weekNumber} (Hiện tại)`, isCurrent: true });
        for (const h of history) {
          if (!weeks.some(w => w.week === h.weekNumber)) {
            weeks.push({ week: h.weekNumber, label: `Tuần ${h.weekNumber}`, isCurrent: false });
          }
        }
        weeks.sort((a, b) => b.week - a.week);
        setAvailableWeeks(weeks);
        if (weeks.length > 0) setSelectedWeek(weeks[0].week);
      } catch (err) {
        console.error('Failed to load weeks navigation:', err);
        setHasRoadmapSub(false);
      }
    }

    async function fetchPlacement() {
      const skipped = typeof window !== 'undefined' && sessionStorage.getItem(PLACEMENT_SKIP_KEY) === '1';
      const cached = useUserStore.getState().placementResult;
      try {
        const result = await getPlacementResult();
        setPlacementResult(result);
        if (!result && !skipped) setShowPlacementDialog(true);
      } catch {
        if (!cached && !skipped) setShowPlacementDialog(true);
      }
    }

    async function fetchProfile() {
      try {
        const res = await apiClient.get<ApiResponse<any>>('/users/me', true);
        const profile = res.result;
        if (profile) {
          if (profile.targetReading) setTargetScore('reading', profile.targetReading);
          if (profile.targetListening) setTargetScore('listening', profile.targetListening);
          if (profile.targetWriting) setTargetScore('writing', profile.targetWriting);
          if (profile.targetSpeaking) setTargetScore('speaking', profile.targetSpeaking);
          if (profile.examDate) setExamDate(profile.examDate);
        }
      } catch { /* ignore */ }
    }

    if (sessionStorage.getItem('showRoadmapTour')) {
      sessionStorage.removeItem('showRoadmapTour');
      setTimeout(() => setTourStep(4), 500);
    } else {
      fetchPlacement();
    }

    loadWeeks();
    fetchProfile();
    refreshProfile();
  }, [hydrated]);

  const firstName = userName?.split(' ').pop() ?? 'bạn';

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {tourStep > 0 && (
        <div className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 flex flex-col items-center justify-center">
          {tourStep === 4 && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
              <ChibiMascot mood="excited" size={160} />
              <h2 className="text-3xl font-extrabold text-white mt-6 mb-2 text-center text-shadow-lg">
                Đã lên lộ trình học tập cho bạn!
              </h2>
              <p className="text-white/90 text-lg mb-12 text-center max-w-md">
                Kéo xuống một chút để xem điều bất ngờ nhé
              </p>
              <button
                onClick={() => {
                  document.getElementById('learning-roadmap-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => setTourStep(5), 800);
                }}
                className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center hover:bg-emerald-50 hover:scale-110 transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)] animate-bounce"
              >
                <ArrowDown className="w-8 h-8" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl p-8 mb-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 border border-emerald-100/60">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full text-xs font-bold text-emerald-700 mb-3 shadow-sm border border-emerald-100">
                <Sparkles className="w-3.5 h-3.5" />
                {getGreeting()}, {firstName}!
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-gray-900">
                Cùng Moni chinh phục IELTS nào!
              </h1>
              <p className="text-gray-600 mt-2 max-w-xl">
                Theo dõi tiến độ, đặt mục tiêu và duy trì nhịp học mỗi ngày để tiến xa hơn.
              </p>
            </div>
            <div className="hidden md:block shrink-0">
              <ChibiMascot mood="excited" size={120} />
            </div>
          </div>
        </section>

        {!hydrated ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-6">
            <PlacementDialog open={showPlacementDialog} onOpenChange={setShowPlacementDialog} />
            <RoadmapReturningDialog
              open={showReturningDialog}
              onOpenChange={setShowReturningDialog}
              onContinue={() => { setShowReturningDialog(false); window.location.reload(); }}
              onRetake={() => { setShowReturningDialog(false); setShowPlacementDialog(true); }}
            />

            {/* Row 1 — Target + Exam */}
            <div className="grid gap-6 md:grid-cols-2">
              <TargetScores />
              <ExamCountdown />
            </div>

            {/* Row 2 — Roadmap (personal insights + weekly plan) */}
            {hasRoadmapSub === false ? (
              <RoadmapPaywall />
            ) : hasRoadmapSub === true ? (
              <div className="space-y-6">
                {availableWeeks.length > 0 && (
                  <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                        <Map className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-gray-900">Chọn tuần học tập</div>
                        <div className="text-xs text-gray-500">Xem lại lộ trình các tuần trước</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const curIdx = availableWeeks.findIndex(w => w.week === selectedWeek);
                          if (curIdx < availableWeeks.length - 1) setSelectedWeek(availableWeeks[curIdx + 1].week);
                        }}
                        disabled={availableWeeks.findIndex(w => w.week === selectedWeek) >= availableWeeks.length - 1}
                        className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-30 disabled:hover:bg-gray-50 transition-all flex items-center justify-center"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <select
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(Number(e.target.value))}
                        className="bg-emerald-50 border-0 text-emerald-700 text-sm rounded-full px-4 py-2 outline-none font-bold min-w-[160px] cursor-pointer hover:bg-emerald-100 transition-colors"
                      >
                        {availableWeeks.map(w => (<option key={w.week} value={w.week}>{w.label}</option>))}
                      </select>
                      <button
                        onClick={() => {
                          const curIdx = availableWeeks.findIndex(w => w.week === selectedWeek);
                          if (curIdx > 0) setSelectedWeek(availableWeeks[curIdx - 1].week);
                        }}
                        disabled={availableWeeks.findIndex(w => w.week === selectedWeek) <= 0}
                        className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-30 disabled:hover:bg-gray-50 transition-all flex items-center justify-center"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                <RoadmapInsights weekNumber={selectedWeek} />
                <LearningRoadmap weekNumber={selectedWeek} />
              </div>
            ) : null}

            {/* Row 3 — Study Progress + Weekly Stats */}
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8"><StudyProgress /></div>
              <div className="lg:col-span-4"><WeeklyStats /></div>
            </div>

            {/* Row 4 — Vocab full width */}
            <VocabReviewStats />

          </div>
        )}
      </div>
    </div>
  );
}
