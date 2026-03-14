import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { RoadmapGoal } from '@/types/roadmap.types';

export async function getRoadmapGoals(): Promise<RoadmapGoal[]> {
  const res = await apiClient.get<ApiResponse<RoadmapGoal[]>>(
    '/api/v1/learner/goals/roadmap',
    true
  );
  return res.result ?? [];
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
