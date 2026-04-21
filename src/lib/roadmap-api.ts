import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { LearnerRoadmapInsights } from '@/types/roadmap.types';
import type { VocabWord, QuizResponse } from '@/types/vocab.types';

export async function getRoadmapInsights(weekNumber?: number): Promise<LearnerRoadmapInsights | null> {
  const url = weekNumber 
    ? `/api/v1/learner/goals/insights/week/${weekNumber}`
    : '/api/v1/learner/goals/insights';
    
  const res = await apiClient.get<ApiResponse<LearnerRoadmapInsights>>(
    url,
    true
  );
  return res.result ?? null;
}

// =====================================================================
// Weekly Plan API (new system)
// =====================================================================

import type { WeeklyPlanResponse, WeeklyPlanSummary, MonthlyAssessmentResponse } from '@/types/roadmap.types';

export async function getWeeklyPlan(weekNumber?: number): Promise<WeeklyPlanResponse | null> {
  const url = weekNumber
    ? `/api/v1/learner/weekly-plan/week/${weekNumber}`
    : '/api/v1/learner/weekly-plan';
    
  const res = await apiClient.get<ApiResponse<WeeklyPlanResponse>>(
    url,
    true
  );
  return res.result ?? null;
}

export async function completeSlot(
  slotId: number,
  score: number,
  totalQuestions: number,
  correctWords?: string[],
  incorrectWords?: string[],
  quizData?: QuizResponse
): Promise<void> {
  await apiClient.patch(
    `/api/v1/learner/weekly-plan/slots/${slotId}/complete`,
    { score, totalQuestions, correctWords, incorrectWords, quizData },
    true
  );
}

export async function evaluateWeek(): Promise<WeeklyPlanResponse | null> {
  const res = await apiClient.post<ApiResponse<WeeklyPlanResponse>>(
    '/api/v1/learner/weekly-plan/evaluate',
    {},
    true
  );
  return res.result ?? null;
}

export async function getWeeklyPlanHistory(): Promise<WeeklyPlanSummary[]> {
  const res = await apiClient.get<ApiResponse<WeeklyPlanSummary[]>>(
    '/api/v1/learner/weekly-plan/history',
    true
  );
  return res.result ?? [];
}

export async function getMonthlyAssessment(): Promise<MonthlyAssessmentResponse | null> {
  const res = await apiClient.get<ApiResponse<MonthlyAssessmentResponse>>(
    '/api/v1/learner/weekly-plan/monthly-assessment',
    true
  );
  return res.result ?? null;
}

export async function startVocabLearning(slotId: number): Promise<VocabWord[]> {
  const res = await apiClient.post<ApiResponse<VocabWord[]>>(
    `/api/v1/learner/weekly-plan/slots/${slotId}/vocab-start`,
    {},
    true
  );
  return res.result ?? [];
}

export async function submitVocabLearning(slotId: number, notLearnedIds: number[], learnedIds: number[]): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ status: string }>>(
    `/api/v1/learner/weekly-plan/slots/${slotId}/vocab-submit-learn`,
    { notLearnedIds, learnedIds },
    true
  );
  return res.code === 1000;
}

export interface LearnMetricStatus {
  hasExistingMetrics: boolean;
  lastMetricDate?: string;
  metricCount?: number;
  lastWeekNumber?: number;
  lastMonthCycle?: number;
  hasPlacementResult: boolean;
}

export async function getLearnMetricStatus(): Promise<LearnMetricStatus> {
  const res = await apiClient.get<ApiResponse<LearnMetricStatus>>(
    '/api/v1/learner/weekly-plan/learn-metric-status',
    true
  );
  return res.result ?? { hasExistingMetrics: false, hasPlacementResult: false };
}

export async function getVocabQuiz(slotId: number): Promise<QuizResponse | null> {
  const res = await apiClient.get<ApiResponse<QuizResponse>>(
    `/api/v1/learner/weekly-plan/slots/${slotId}/vocab-test`,
    true
  );
  return res.result ?? null;
}
