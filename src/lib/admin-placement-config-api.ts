import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';

export interface PlacementConfigResponse {
  id: number;
  name: string;
  readingTestId: number;
  readingTestTitle: string;
  listeningTestId: number;
  listeningTestTitle: string;
  writingTestId: number;
  writingTestTitle: string;
  speakingTestId: number;
  speakingTestTitle: string;
  isActive: boolean;
  createdAt: string;
}

export interface PlacementConfigRequest {
  name: string;
  readingTestId: number;
  listeningTestId: number;
  writingTestId: number;
  speakingTestId: number;
}

const BASE = '/api/v1/admin/placement-configs';

export async function listPlacementConfigs(): Promise<PlacementConfigResponse[]> {
  const response = await apiClient.get<ApiResponse<PlacementConfigResponse[]>>(BASE, true);
  if (!response.result) throw new Error('Failed to fetch placement configs');
  return response.result;
}

export async function createPlacementConfig(
  data: PlacementConfigRequest
): Promise<PlacementConfigResponse> {
  const response = await apiClient.post<ApiResponse<PlacementConfigResponse>>(BASE, data, true);
  if (!response.result) throw new Error('Failed to create placement config');
  return response.result;
}

export async function updatePlacementConfig(
  id: number,
  data: PlacementConfigRequest
): Promise<PlacementConfigResponse> {
  const response = await apiClient.put<ApiResponse<PlacementConfigResponse>>(
    `${BASE}/${id}`,
    data,
    true
  );
  if (!response.result) throw new Error('Failed to update placement config');
  return response.result;
}

export async function activatePlacementConfig(id: number): Promise<void> {
  await apiClient.put<ApiResponse<void>>(`${BASE}/${id}/activate`, {}, true);
}

export async function deletePlacementConfig(id: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`${BASE}/${id}`, true);
}
