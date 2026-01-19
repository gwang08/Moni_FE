import type { Activity, TargetScores } from '@/types';

export interface CalendarData {
  date: string;
  count: number;
}

/**
 * Transforms activities into calendar-friendly format with daily counts
 */
export function getCalendarData(activities: Activity[]): CalendarData[] {
  const dateCountMap = new Map<string, number>();

  activities.forEach((activity) => {
    const currentCount = dateCountMap.get(activity.date) || 0;
    dateCountMap.set(activity.date, currentCount + 1);
  });

  return Array.from(dateCountMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Gets activities from the last 7 days
 */
export function getWeeklyStats(activities: Activity[]): Activity[] {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  return activities.filter((activity) => {
    const activityDate = new Date(activity.date);
    return activityDate >= sevenDaysAgo && activityDate <= today;
  });
}

/**
 * Calculates overall IELTS band score with proper rounding to nearest 0.5
 * IELTS rounding rules: .25 rounds down, .75 rounds up
 */
export function calculateOverallScore(scores: TargetScores): number {
  const { listening, reading, writing, speaking } = scores;

  // Calculate average
  const average = (listening + reading + writing + speaking) / 4;

  // Round to nearest 0.5
  // IELTS rule: .25 rounds down to .0, .75 rounds up to .5
  const rounded = Math.round(average * 2) / 2;

  return rounded;
}
