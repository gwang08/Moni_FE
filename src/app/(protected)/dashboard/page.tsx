'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown } from 'lucide-react';
import { ChibiMascot } from '@/components/ui/chibi-mascot';
import { useHydration } from '@/hooks/use-hydration';
import { SkeletonCard } from '@/components/ui/skeleton';
import { TargetScores } from '@/components/dashboard/target-scores';
import { ExamCountdown } from '@/components/dashboard/exam-countdown';
import { ActivityCalendar } from '@/components/dashboard/activity-calendar';
import { WeeklyStats } from '@/components/dashboard/weekly-stats';
import { VocabReviewStats } from '@/components/dashboard/vocab-review-stats';
import { PracticeHistory } from '@/components/dashboard/practice-history';
import { useAuthStore } from '@/store/auth-store';
import { PlacementDialog } from '@/components/dashboard/placement-dialog';
import { LearningRoadmap } from '@/components/dashboard/learning-roadmap';
import { RoadmapInsights } from '@/components/dashboard/roadmap-insights';
import { useUserStore } from '@/store/user-store';
import { useTourStore } from '@/store/tour-store';
import { getPlacementResult } from '@/lib/placement-api';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
      <SkeletonCard className="h-80" />
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard className="h-72" />
        <SkeletonCard className="h-72" />
      </div>
      <SkeletonCard className="h-64" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useHydration();
  const userRole = useAuthStore((state) => state.user?.role);
  const setPlacementResult = useUserStore((s) => s.setPlacementResult);
  const setTargetScore = useUserStore((s) => s.setTargetScore);
  const setExamDate = useUserStore((s) => s.setExamDate);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { step: tourStep, setStep: setTourStep } = useTourStore();
  const [showPlacementDialog, setShowPlacementDialog] = useState(false);
  const fetchedRef = useRef(false);

  // Redirect ADMIN and EXPERT away from learner dashboard
  useEffect(() => {
    if (!hydrated) return;
    if (userRole === 'ADMIN') {
      router.replace('/admin');
      return;
    }
    if (userRole === 'EXPERT') {
      router.replace('/expert/dashboard');
      return;
    }
  }, [hydrated, userRole, router]);

  useEffect(() => {
    if (!hydrated || fetchedRef.current) return;
    fetchedRef.current = true;

    // Fetch placement result
    async function fetchPlacement() {
      try {
        const result = await getPlacementResult();
        setPlacementResult(result);
        if (!result) setShowPlacementDialog(true);
      } catch {
        setShowPlacementDialog(true);
      }
    }

    // Sync target scores + exam date from backend
    interface ProfileData {
      targetReading?: number;
      targetListening?: number;
      targetWriting?: number;
      targetSpeaking?: number;
      examDate?: string;
    }
    async function fetchProfile() {
      try {
        const res = await apiClient.get<ApiResponse<ProfileData>>('/users/me', true);
        const profile = res.result;
        if (profile) {
          if (profile.targetReading) setTargetScore('reading', profile.targetReading);
          if (profile.targetListening) setTargetScore('listening', profile.targetListening);
          if (profile.targetWriting) setTargetScore('writing', profile.targetWriting);
          if (profile.targetSpeaking) setTargetScore('speaking', profile.targetSpeaking);
          if (profile.examDate) setExamDate(profile.examDate);
        }
      } catch { /* ignore - localStorage fallback */ }
    }
    
    // Check if coming back from Placement Test
    if (sessionStorage.getItem('showRoadmapTour')) {
      sessionStorage.removeItem('showRoadmapTour');
      // Delay slightly to ensure UI is hydrated
      setTimeout(() => setTourStep(4), 500);
    } else {
      fetchPlacement();
    }

    fetchProfile();
    refreshProfile(); // Sync credit balance in header
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Tour Overlay */}
      {tourStep > 0 && (
        <div className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 flex flex-col items-center justify-center">
          {tourStep === 4 && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
              <ChibiMascot mood="excited" size={160} />
              <h2 className="text-3xl font-extrabold text-white mt-6 mb-2 text-center text-shadow-lg">
                Đã lên lộ trình học tập cho bạn!
              </h2>
              <p className="text-orange-100 text-lg mb-12 text-center max-w-md">
                Kéo xuống một chút để xem điều bất ngờ nhé 👇
              </p>
              
              <button
                onClick={() => {
                  document.getElementById('learning-roadmap-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => setTourStep(5), 800);
                }}
                className="w-16 h-16 rounded-full bg-white text-orange-500 flex items-center justify-center hover:bg-orange-50 hover:scale-110 transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)] animate-bounce"
              >
                <ArrowDown className="w-8 h-8" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Moni đồng hành cùng bạn
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Theo dõi tiến độ và đặt mục tiêu IELTS của bạn
          </p>
        </div>

        {!hydrated ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-6">
            <PlacementDialog open={showPlacementDialog} onOpenChange={setShowPlacementDialog} />
            {/* Top Row: Goals + Exam */}
            <div className="grid gap-6 md:grid-cols-2">
              <TargetScores />
              <ExamCountdown />
            </div>

            {/* Vocab Stats - Full Width */}
            <VocabReviewStats />

            {/* Personalized Roadmap Metrics */}
            <RoadmapInsights />

            {/* Learning Roadmap */}
            <LearningRoadmap />

            {/* Middle Row: Calendar + Weekly Stats */}
            <div className="grid gap-6 md:grid-cols-2">
              <ActivityCalendar />
              <WeeklyStats />
            </div>

            {/* Practice History (includes expert sessions in Speaking tab) */}
            <PracticeHistory />
          </div>
        )}
      </div>
    </div>
  );
}
