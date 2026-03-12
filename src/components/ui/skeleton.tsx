import { cn } from '@/lib/utils';

/** Base shimmer block — pass any sizing/shape via className */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-2xl bg-gray-200/60', className)}
      {...props}
    />
  );
}

/** Card-shaped skeleton with border — good for dashboard cards, list items */
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white border border-gray-100 animate-pulse',
        className,
      )}
      {...props}
    />
  );
}

/** Text line skeleton — defaults to h-4, pass w-* for width */
function SkeletonLine({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('h-4 rounded-lg bg-gray-200/60 animate-pulse', className)}
      {...props}
    />
  );
}

/** Circle skeleton — avatars, icons */
function SkeletonCircle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-full bg-gray-200/60 animate-pulse', className)}
      {...props}
    />
  );
}

/** Table skeleton — rows of shimmer lines mimicking a data table */
function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-gray-200/80 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3 flex gap-4 border-b border-gray-100 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={cn('h-4 rounded bg-gray-200/60', c === 0 ? 'w-1/3' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Page-level skeleton — header bar + content area */
function SkeletonPage({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-4 animate-pulse', className)} {...props}>
      <div className="h-10 rounded-xl bg-gray-200/60 w-1/3" />
      <SkeletonCard className="h-64" />
      <SkeletonCard className="h-48" />
    </div>
  );
}

/** Practice page skeleton — mimics split-pane exercise layout */
function SkeletonPractice() {
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col animate-pulse">
      {/* Header bar */}
      <div className="h-12 bg-white border-b border-gray-100 flex items-center px-5 gap-4">
        <div className="w-8 h-8 rounded-full bg-gray-200/60" />
        <div className="h-4 w-40 rounded bg-gray-200/60" />
        <div className="ml-auto h-8 w-24 rounded-full bg-gray-200/60" />
      </div>
      {/* Content */}
      <div className="flex-1 flex">
        <div className="w-1/2 p-6 space-y-4 border-r border-gray-100">
          <div className="h-5 w-2/3 rounded bg-gray-200/60" />
          <div className="h-4 w-full rounded bg-gray-200/60" />
          <div className="h-4 w-5/6 rounded bg-gray-200/60" />
          <div className="h-4 w-4/5 rounded bg-gray-200/60" />
          <div className="h-40 rounded-xl bg-gray-200/40 mt-4" />
        </div>
        <div className="w-1/2 p-6 space-y-4">
          <div className="h-5 w-1/2 rounded bg-gray-200/60" />
          <div className="h-20 rounded-xl bg-gray-200/40" />
          <div className="h-20 rounded-xl bg-gray-200/40" />
          <div className="h-20 rounded-xl bg-gray-200/40" />
        </div>
      </div>
    </div>
  );
}

/** Result/score skeleton — mimics score card layout */
function SkeletonResult() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-56px)] animate-pulse">
      <div className="w-full max-w-lg space-y-6 p-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gray-200/60" />
        </div>
        <div className="h-5 w-1/2 mx-auto rounded bg-gray-200/60" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard className="h-20" />
          <SkeletonCard className="h-20" />
          <SkeletonCard className="h-20" />
          <SkeletonCard className="h-20" />
        </div>
        <SkeletonCard className="h-32" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonLine,
  SkeletonCircle,
  SkeletonTable,
  SkeletonPage,
  SkeletonPractice,
  SkeletonResult,
};
