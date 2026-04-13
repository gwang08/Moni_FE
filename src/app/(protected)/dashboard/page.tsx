'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  const tourStep = useTourStore((s) => s.step);
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

    fetchPlacement();
    fetchProfile();
    refreshProfile(); // Sync credit balance in header
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Tour Overlay */}
      {tourStep > 0 && (
        <div className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300" />
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
