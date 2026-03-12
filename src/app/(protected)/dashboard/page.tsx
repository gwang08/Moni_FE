'use client';

import { useHydration } from '@/hooks/use-hydration';
import { SkeletonCard } from '@/components/ui/skeleton';
import { TargetScores } from '@/components/dashboard/target-scores';
import { ExamCountdown } from '@/components/dashboard/exam-countdown';
import { ActivityCalendar } from '@/components/dashboard/activity-calendar';
import { WeeklyStats } from '@/components/dashboard/weekly-stats';
import { PracticeHistory } from '@/components/dashboard/practice-history';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard className="h-72" />
        <SkeletonCard className="h-72" />
      </div>
      <SkeletonCard className="h-64" />
    </div>
  );
}

export default function DashboardPage() {
  const hydrated = useHydration();

  return (
    <div className="min-h-screen bg-gray-50">
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
            {/* Top Row: Goals + Exam */}
            <div className="grid gap-6 md:grid-cols-2">
              <TargetScores />
              <ExamCountdown />
            </div>

            {/* Middle Row: Calendar + Weekly Stats */}
            <div className="grid gap-6 md:grid-cols-2">
              <ActivityCalendar />
              <WeeklyStats />
            </div>

            {/* Bottom: Practice History */}
            <PracticeHistory />
          </div>
        )}
      </div>
    </div>
  );
}
