'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  getUserById,
  banUser,
  getAdminUserAttempts,
  getAdminUserWritingSubmissions,
  getAdminUserScoringSessions,
  getAdminUserRoadmapInsights,
  getAdminUserWeeklyPlan,
  getAdminUserWeeklyPlanHistory,
} from '@/lib/admin-api';
import { UserDetailHeader } from '@/components/admin/user-detail/user-detail-header';
import { KpiCards } from '@/components/admin/user-detail/kpi-cards';
import { TabOverview } from '@/components/admin/user-detail/tab-overview';
import { TabRoadmap } from '@/components/admin/user-detail/tab-roadmap';
import { TabAttempts } from '@/components/admin/user-detail/tab-attempts';
import { TabTimeStats } from '@/components/admin/user-detail/tab-time-stats';

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const daySet = new Set<string>();
  dates.forEach((iso) => {
    if (!iso) return;
    const d = new Date(iso);
    daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (streak < 400) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (daySet.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // If today has no activity, break only if streak already started (yesterday counts)
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        const y = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
        if (!daySet.has(y)) break;
        continue;
      }
      break;
    }
  }
  return streak;
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [banOpen, setBanOpen] = useState(false);

  const userQ = useQuery({ queryKey: ['admin', 'user', id], queryFn: () => getUserById(id) });
  const attemptsQ = useQuery({ queryKey: ['admin', 'user', id, 'attempts'], queryFn: () => getAdminUserAttempts(id) });
  const writingQ = useQuery({ queryKey: ['admin', 'user', id, 'writing'], queryFn: () => getAdminUserWritingSubmissions(id) });
  const sessionsQ = useQuery({ queryKey: ['admin', 'user', id, 'sessions'], queryFn: () => getAdminUserScoringSessions(id) });
  const insightsQ = useQuery({ queryKey: ['admin', 'user', id, 'insights'], queryFn: () => getAdminUserRoadmapInsights(id), retry: false });
  const weeklyQ = useQuery({ queryKey: ['admin', 'user', id, 'weekly'], queryFn: () => getAdminUserWeeklyPlan(id), retry: false });
  const historyQ = useQuery({ queryKey: ['admin', 'user', id, 'history'], queryFn: () => getAdminUserWeeklyPlanHistory(id), retry: false });

  const banMutation = useMutation({
    mutationFn: () => banUser(id),
    onSuccess: () => {
      toast.success('Đã ban người dùng');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setBanOpen(false);
      router.push('/admin/users');
    },
    onError: () => toast.error('Ban người dùng thất bại'),
  });

  if (userQ.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  if (userQ.isError || !userQ.data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Không tìm thấy người dùng này.
        </div>
      </div>
    );
  }

  const user = userQ.data;
  const attempts = attemptsQ.data ?? [];
  const writing = writingQ.data ?? [];
  const sessions = sessionsQ.data ?? [];
  const insights = insightsQ.data ?? null;
  const weeklyPlan = weeklyQ.data ?? null;
  const history = historyQ.data ?? [];

  const totalAttempts = attempts.length + writing.length + sessions.length;
  const totalSeconds = attempts.reduce((sum, a) => sum + Math.max(0, a.elapsedSeconds), 0);
  const aiCount = attempts.length + writing.length;
  const expertCount = sessions.length;

  const activityDates = [
    ...attempts.map((a) => a.submittedAt ?? a.startedAt).filter(Boolean) as string[],
    ...writing.map((w) => w.submittedAt),
    ...sessions.map((s) => s.createdAt ?? s.submittedAt).filter(Boolean) as string[],
  ];
  const streak = computeStreak(activityDates);

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      <UserDetailHeader user={user} onBack={() => router.push('/admin/users')} onBan={() => setBanOpen(true)} />

      <KpiCards
        totalAttempts={totalAttempts}
        totalSeconds={totalSeconds}
        currentBand={insights?.calibratedOverall ?? null}
        targetBand={insights?.targetOverall ?? user.targetBand ?? null}
        aiCount={aiCount}
        expertCount={expertCount}
        streak={streak}
      />

      <Tabs defaultValue="overview">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="roadmap">Lộ trình</TabsTrigger>
          <TabsTrigger value="attempts">Bài đã làm ({totalAttempts})</TabsTrigger>
          <TabsTrigger value="time">Thống kê thời gian</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <TabOverview
            attempts={attempts}
            writing={writing}
            sessions={sessions}
            insights={insights}
            weeklyPlan={weeklyPlan}
          />
        </TabsContent>

        <TabsContent value="roadmap" className="mt-4">
          <TabRoadmap insights={insights} weeklyPlan={weeklyPlan} history={history} />
        </TabsContent>

        <TabsContent value="attempts" className="mt-4">
          <TabAttempts attempts={attempts} writing={writing} sessions={sessions} />
        </TabsContent>

        <TabsContent value="time" className="mt-4">
          <TabTimeStats attempts={attempts} writing={writing} sessions={sessions} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={banOpen}
        onOpenChange={setBanOpen}
        title="Ban người dùng"
        description={`Bạn có chắc muốn ban "${user.full_name || user.email}"? Người dùng sẽ không thể đăng nhập.`}
        confirmText="Ban"
        variant="destructive"
        onConfirm={() => banMutation.mutateAsync()}
      />
    </div>
  );
}
