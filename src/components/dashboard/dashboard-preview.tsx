'use client';

import { useHydration } from '@/hooks/use-hydration';
import { SkeletonCard } from '@/components/ui/skeleton';
import { TargetScores } from './target-scores';
import { ExamCountdown } from './exam-countdown';
import { StudyProgress } from './study-progress';

function DashboardSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} className="h-[300px]" />
      ))}
    </div>
  );
}

export function DashboardPreview() {
  const hydrated = useHydration();

  return (
    <section className="relative bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">
          Theo dõi hành trình của bạn
        </h2>
        <p className="text-center text-gray-500 mb-12">
          Đặt mục tiêu và theo dõi tiến độ học tập
        </p>

        {!hydrated ? (
          <DashboardSkeleton />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <TargetScores />
            <ExamCountdown />
            <div className="md:col-span-2 mt-4">
              <StudyProgress />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
