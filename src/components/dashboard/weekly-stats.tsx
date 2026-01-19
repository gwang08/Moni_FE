'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUserStore } from '@/store/user-store';
import { getWeeklyStats } from '@/lib/calendar-utils';
import type { SkillKey } from '@/types';

const SKILL_LABELS: Record<SkillKey, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

interface SkillStats {
  skill: SkillKey;
  sessions: number;
  totalMinutes: number;
}

function aggregateWeeklyStats(activities: ReturnType<typeof getWeeklyStats>): SkillStats[] {
  const statsMap = new Map<SkillKey, { sessions: number; totalMinutes: number }>();

  activities.forEach((activity) => {
    const current = statsMap.get(activity.skill) || { sessions: 0, totalMinutes: 0 };
    statsMap.set(activity.skill, {
      sessions: current.sessions + 1,
      totalMinutes: current.totalMinutes + activity.duration,
    });
  });

  return Array.from(statsMap.entries()).map(([skill, stats]) => ({
    skill,
    sessions: stats.sessions,
    totalMinutes: stats.totalMinutes,
  }));
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function WeeklyStats() {
  const activities = useUserStore((state) => state.activities);
  const weeklyActivities = getWeeklyStats(activities);
  const stats = aggregateWeeklyStats(weeklyActivities);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Stats (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No activities in the last 7 days
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kỹ năng</TableHead>
                <TableHead>Số buổi</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((stat) => (
                <TableRow key={stat.skill}>
                  <TableCell className="font-medium">
                    {SKILL_LABELS[stat.skill]}
                  </TableCell>
                  <TableCell>{stat.sessions}</TableCell>
                  <TableCell>{formatDuration(stat.totalMinutes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
