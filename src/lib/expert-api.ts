import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { ExpertProfile, ScoringSession, ExpertEvaluation } from '@/types/expert.types';

export async function getExperts(specialization?: string): Promise<ExpertProfile[]> {
  const query = specialization ? `?specialization=${specialization}` : '';
  const response = await apiClient.get<ApiResponse<ExpertProfile[]>>(
    `/api/v1/experts${query}`,
    true
  );
  return response.result ?? [];
}

export async function getExpertDetail(id: number): Promise<ExpertProfile> {
  const response = await apiClient.get<ApiResponse<ExpertProfile>>(
    `/api/v1/experts/${id}`,
    true
  );
  if (!response.result) throw new Error('Expert not found');
  return response.result;
}

export async function createScoringSession(data: {
  expertId: number;
  skill: string;
  content: string;
  testId?: number;
}): Promise<ScoringSession> {
  const response = await apiClient.post<ApiResponse<ScoringSession>>(
    '/api/v1/scoring-sessions',
    data,
    true
  );
  if (!response.result) throw new Error('Failed to create scoring session');
  return response.result;
}

export async function cancelScoringSession(id: number): Promise<void> {
  await apiClient.patch(`/api/v1/scoring-sessions/${id}/cancel`, undefined, true);
}

export async function getQueuePosition(id: number): Promise<{ position: number; status: string; roomUrl: string }> {
  const response = await apiClient.get<ApiResponse<{ position: number; status: string; roomUrl: string }>>(
    `/api/v1/scoring-sessions/${id}/queue-position`,
    true
  );
  return response.result ?? { position: 0, status: 'QUEUED', roomUrl: '' };
}

export async function getMySessions(): Promise<ScoringSession[]> {
  const response = await apiClient.get<ApiResponse<ScoringSession[]>>(
    '/api/v1/scoring-sessions/my',
    true
  );
  return response.result ?? [];
}

export async function getSessionEvaluation(sessionId: number): Promise<ExpertEvaluation> {
  const response = await apiClient.get<ApiResponse<ExpertEvaluation>>(
    `/api/v1/scoring-sessions/${sessionId}/evaluation`,
    true
  );
  if (!response.result) throw new Error('Evaluation not found');
  return response.result;
}
