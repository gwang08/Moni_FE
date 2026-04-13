import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { LearnerRoadmapInsights, RoadmapGoal } from '@/types/roadmap.types';
import type { VocabWord, QuizResponse } from '@/types/vocab.types';

export async function getRoadmapGoals(): Promise<RoadmapGoal[]> {
  const res = await apiClient.get<ApiResponse<RoadmapGoal[]>>(
    '/api/v1/learner/goals/roadmap',
    true
  );
  return res.result ?? [];
}

export async function updateGoal(
  goalId: number,
  data: { targetBand: number; deadline: string }
): Promise<void> {
  await apiClient.put(`/api/v1/learner/goals/${goalId}`, data, true);
}

export async function updateTaskStatus(
  taskId: number,
  status: 'TODO' | 'DONE'
): Promise<void> {
  await apiClient.patch(
    `/api/v1/learner/goals/tasks/${taskId}/status`,
    { status },
    true
  );
}

export async function getRoadmapInsights(): Promise<LearnerRoadmapInsights | null> {
  const res = await apiClient.get<ApiResponse<LearnerRoadmapInsights>>(
    '/api/v1/learner/goals/insights',
    true
  );
  return res.result ?? null;
}

// =====================================================================
// Weekly Plan API (new system)
// =====================================================================

import type { WeeklyPlanResponse, WeeklyPlanSummary, MonthlyAssessmentResponse } from '@/types/roadmap.types';

export async function getWeeklyPlan(): Promise<WeeklyPlanResponse | null> {
  const res = await apiClient.get<ApiResponse<WeeklyPlanResponse>>(
    '/api/v1/learner/weekly-plan',
    true
  );
  return res.result ?? null;
}

export async function completeSlot(
  slotId: number,
  score: number,
  totalQuestions: number,
  correctWords?: string[]
): Promise<void> {
  await apiClient.patch(
    `/api/v1/learner/weekly-plan/slots/${slotId}/complete`,
    { score, totalQuestions, correctWords },
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

export async function getVocabQuiz(slotId: number): Promise<QuizResponse | null> {
  const res = await apiClient.get<ApiResponse<QuizResponse>>(
    `/api/v1/learner/weekly-plan/slots/${slotId}/vocab-test`,
    true
  );
  return res.result ?? null;
}
