'use client';

import { useHydration } from '@/hooks/use-hydration';
import { TargetScores } from './target-scores';
import { ExamCountdown } from './exam-countdown';
import { ActivityCalendar } from './activity-calendar';
import { WeeklyStats } from './weekly-stats';

function DashboardSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-[300px] rounded-xl border bg-card animate-pulse"
        />
      ))}
    </div>
  );
}

export function DashboardPreview() {
  const hydrated = useHydration();

  return (
    <section className="relative bg-white pt-24 pb-16 wave-section">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">
          Theo dõi hành trình của bạn
        </h2>
        <p className="text-center text-gray-600 mb-12">
          Đặt mục tiêu và theo dõi tiến độ học tập
        </p>

        {!hydrated ? (
          <DashboardSkeleton />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <TargetScores />
            <ExamCountdown />
            <ActivityCalendar />
            <WeeklyStats />
          </div>
        )}
      </div>
    </section>
  );
}
