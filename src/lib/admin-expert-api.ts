import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { ExpertProfile, CreateExpertRequest } from '@/types/expert.types';

export async function getAdminExperts(): Promise<ExpertProfile[]> {
  const response = await apiClient.get<ApiResponse<ExpertProfile[]>>(
    '/api/v1/admin/experts',
    true
  );
  return response.result ?? [];
}

export async function createExpert(data: CreateExpertRequest): Promise<ExpertProfile> {
  const response = await apiClient.post<ApiResponse<ExpertProfile>>(
    '/api/v1/admin/experts',
    data,
    true
  );
  if (!response.result) throw new Error('Failed to create expert');
  return response.result;
}

export async function updateExpertStatus(id: number, status: string): Promise<void> {
  await apiClient.patch(
    `/api/v1/admin/experts/${id}/status`,
    { status },
    true
  );
}

export async function deleteExpert(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/admin/experts/${id}`, true);
}
