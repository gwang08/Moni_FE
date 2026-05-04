'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { FeatureHighlightTour, hasSeenFeatureHighlight } from '@/components/dashboard/feature-highlight-tour';
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
  const { tourType, step: tourStep, setTour, setStep: setTourStep, stopTour } = useTourStore();
  const searchParams = useSearchParams();
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

    async function loadWeeks(): Promise<boolean> {
      try {
        const roadmapStatus = await getRoadmapSubscriptionStatus();
        setHasRoadmapSub(roadmapStatus.hasActiveSubscription);
        if (!roadmapStatus.hasActiveSubscription) return false;

        const [currentPlan, history, metricStatus] = await Promise.all([
          getWeeklyPlan().catch(() => null),
          getWeeklyPlanHistory().catch(() => []),
          getLearnMetricStatus().catch(() => ({ hasExistingMetrics: false, hasPlacementResult: false })),
        ]);

        if (!currentPlan && metricStatus.hasExistingMetrics && history.length > 0) {
          setShowReturningDialog(true);
          return true;
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

        // New week tour: trigger first time user visits week 2+
        if (currentPlan && currentPlan.weekNumber > 1) {
          const tourKey = `newWeekTourDone_${currentPlan.weekNumber}`;
          if (!localStorage.getItem(tourKey)) {
            setTimeout(() => setTour('new-week', 10), 500);
          }
        }
        return true;
      } catch (err) {
        console.error('Failed to load weeks navigation:', err);
        setHasRoadmapSub(false);
        return false;
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

    // Determine which tour to trigger
    const shouldStartSetupTour = searchParams.get('startSetupTour') === 'true';
    const shouldStartRoadmapTour = !!sessionStorage.getItem('showRoadmapTour');
    const shouldStartFeatureTour = !!sessionStorage.getItem('startFeatureTour');

    // Clean up URL param without re-render
    if (shouldStartSetupTour) {
      window.history.replaceState({}, '', '/dashboard');
    }
    if (shouldStartFeatureTour) {
      sessionStorage.removeItem('startFeatureTour');
    }

    if (shouldStartSetupTour || shouldStartRoadmapTour) {
      // Setup tour or roadmap walkthrough — reset step while waiting for sub check
      setTourStep(0);
    } else {
      fetchPlacement();
    }

    loadWeeks().then(async (hasSub) => {
      // Tour B: post-payment setup tour — user just bought subscription
      if (shouldStartSetupTour && hasSub) {
        // Check if user already has aim + placement result → skip setup steps
        const cachedPlacement = useUserStore.getState().placementResult;
        let placement = cachedPlacement;
        if (!placement) {
          try { placement = await getPlacementResult(); } catch { /* ignore */ }
          if (placement) setPlacementResult(placement);
        }
        const scores = useUserStore.getState().targetScores;
        const hasAim = scores.reading > 0 || scores.listening > 0 || scores.writing > 0 || scores.speaking > 0;

        if (hasAim && placement) {
          // User already set up — set AI recommendation trigger so it fires after tour
          sessionStorage.setItem('triggerAiRecommendation', String(placement.id));
          // Go straight to roadmap walkthrough (step 4)
          setTimeout(() => setTour('setup', 4), 500);
        } else if (hasAim && !placement) {
          // Has aim but no placement — start at step 3 (placement test)
          setTimeout(() => setTour('setup', 3), 500);
        } else {
          // Fresh user — full setup tour from step 1
          setTimeout(() => setTour('setup', 1), 500);
        }
        return;
      }

      // Tour B: post-placement roadmap walkthrough (steps 4-7)
      if (shouldStartRoadmapTour) {
        if (hasSub) {
          setTimeout(() => setTour('setup', 4), 500);
        } else {
          // No subscription — scroll to paywall
          setTimeout(() => {
            setTour('setup', 8);
            setTimeout(() => {
              document.getElementById('roadmap-paywall-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }, 500);
        }
        return;
      }

      // Tour A: feature highlight tour — triggered from navbar or first visit
      if (shouldStartFeatureTour && !hasSub && !hasSeenFeatureHighlight()) {
        setTimeout(() => setTour('feature', 1), 300);
        return;
      }

      // Auto-trigger Tour A on first dashboard visit for users without sub
      if (!hasSub && !hasSeenFeatureHighlight() && !shouldStartSetupTour) {
        setTimeout(() => setTour('feature', 1), 500);
      }
    });
    fetchProfile();
    refreshProfile();
  }, [hydrated]);

  // Detect tour completion: when tourType transitions back to 'none' after being active,
  // clear the `showRoadmapTour` flag and notify other components (e.g. target-scores
  // waits for this to open the AI recommendation dialog).
  // Dispatch is deferred ~400ms so the user sees the tour overlay/ring fully disappear
  // before the AI dialog opens — prevents visual overlap reported by users.
  const tourActiveRef = useRef(false);
  useEffect(() => {
    if (tourType !== 'none' && tourStep > 0) {
      tourActiveRef.current = true;
      return;
    }
    if (tourActiveRef.current && tourType === 'none' && tourStep === 0) {
      tourActiveRef.current = false;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('showRoadmapTour');
        const t = setTimeout(() => {
          window.dispatchEvent(new Event('roadmap-tour-completed'));
        }, 400);
        return () => clearTimeout(t);
      }
    }
  }, [tourType, tourStep]);

  const firstName = userName?.split(' ').pop() ?? 'bạn';

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">
      {/* Feature Highlight Tour (Tour A) — full-screen overlay, handled by its own component */}
      {tourType === 'feature' && <FeatureHighlightTour />}

      {/* Setup Tour (Tour B) — dark backdrop for steps 1-7 */}
      {tourType === 'setup' && tourStep > 0 && tourStep <= 7 && hasRoadmapSub === true && (
        <div className="fixed inset-x-0 bottom-0 top-14 bg-black/60 z-30 transition-opacity duration-300 flex flex-col items-center justify-center">
          {/* Skip tour button - always visible as safety escape */}
          {tourStep !== 4 && (
            <button
              onClick={() => stopTour()}
              className="fixed top-20 right-4 z-[80] px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-medium transition-all border border-white/20"
            >
              Bỏ qua
            </button>
          )}
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

      {/* Setup Tour step 8 — paywall focus */}
      {tourType === 'setup' && tourStep === 8 && (
        <div className="fixed inset-x-0 bottom-0 top-14 bg-black/60 z-30 transition-opacity duration-300" />
      )}

      {/* New-week tour overlay (step 10) */}
      {tourType === 'new-week' && tourStep === 10 && hasRoadmapSub === true && (
        <div className="fixed inset-x-0 bottom-0 top-14 bg-black/60 z-30 transition-opacity duration-300 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            <ChibiMascot mood="excited" size={160} />
            <h2 className="text-3xl font-extrabold text-white mt-6 mb-2 text-center text-shadow-lg">
              Tuần mới bắt đầu rồi!
            </h2>
            <p className="text-white/90 text-lg mb-12 text-center max-w-md">
              Cùng xem AI phân tích kết quả tuần trước nhé
            </p>
            <button
              onClick={() => {
                document.getElementById('roadmap-insights-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => setTourStep(11), 800);
              }}
              className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center hover:bg-emerald-50 hover:scale-110 transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)] animate-bounce"
            >
              <ArrowDown className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* New-week tour backdrop for steps 11-12 */}
      {tourType === 'new-week' && (tourStep === 11 || tourStep === 12) && hasRoadmapSub === true && (
        <div className="fixed inset-x-0 bottom-0 top-14 bg-black/60 z-30 transition-opacity duration-300" />
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
              <div id="roadmap-paywall-section" className={`relative transition-all duration-300 ${tourType === 'setup' && tourStep === 8 ? 'z-50 ring-4 ring-emerald-400 shadow-2xl rounded-2xl' : ''}`}>
                {tourType === 'setup' && tourStep === 8 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full w-80 bg-white p-4 rounded-2xl shadow-xl border border-emerald-100 z-50 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex gap-3 mb-2">
                      <ChibiMascot mood="excited" size={40} />
                      <div className="font-bold text-gray-800 text-sm">Gần xong rồi!</div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Moni đã phân tích xong trình độ của bạn! Hãy mua Gói Lộ Trình để AI lên kế hoạch học tập cá nhân hóa cho bạn nhé.
                    </p>
                    <button
                      onClick={() => stopTour()}
                      className="w-full flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Đã hiểu!
                    </button>
                  </div>
                )}
                <RoadmapPaywall />
              </div>
            ) : hasRoadmapSub === true ? (
              <div className="space-y-6">
                {availableWeeks.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white px-4 sm:px-6 py-4 rounded-3xl shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                        <Map className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-gray-900 truncate">Chọn tuần học tập</div>
                        <div className="text-xs text-gray-500 truncate">Xem lại lộ trình các tuần trước</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const curIdx = availableWeeks.findIndex(w => w.week === selectedWeek);
                          if (curIdx < availableWeeks.length - 1) setSelectedWeek(availableWeeks[curIdx + 1].week);
                        }}
                        disabled={availableWeeks.findIndex(w => w.week === selectedWeek) >= availableWeeks.length - 1}
                        className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-30 disabled:hover:bg-gray-50 transition-all flex items-center justify-center"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <select
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(Number(e.target.value))}
                        className="flex-1 sm:flex-none min-w-0 sm:min-w-[160px] bg-emerald-50 border-0 text-emerald-700 text-sm rounded-full px-3 sm:px-4 py-2 outline-none font-bold cursor-pointer hover:bg-emerald-100 transition-colors"
                      >
                        {availableWeeks.map(w => (<option key={w.week} value={w.week}>{w.label}</option>))}
                      </select>
                      <button
                        onClick={() => {
                          const curIdx = availableWeeks.findIndex(w => w.week === selectedWeek);
                          if (curIdx > 0) setSelectedWeek(availableWeeks[curIdx - 1].week);
                        }}
                        disabled={availableWeeks.findIndex(w => w.week === selectedWeek) <= 0}
                        className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-30 disabled:hover:bg-gray-50 transition-all flex items-center justify-center"
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
