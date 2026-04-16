import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';

export interface FullTestResponse {
  id: number;
  title: string;
  skill: string;
  testType?: string;
  duration: number;
  status: string;
  createdAt: string;
  stimuli: {
    id: number;
    section: number;
    title: string;
    questionCount?: number;
    testId?: number;
    testTitle?: string;
  }[];
}

export interface StimulusOption {
  stimulusId: number;
  testId?: number;
  title: string;
  questionCount: number;
}

export async function getFullTests(): Promise<FullTestResponse[]> {
  const res = await apiClient.get<ApiResponse<FullTestResponse[]>>('/api/v1/admin/full-tests', true);
  return res.result ?? [];
}

export async function getAvailableStimuli(skill: string): Promise<Record<number, StimulusOption[]>> {
  const res = await apiClient.get<ApiResponse<Record<number, StimulusOption[]>>>(
    `/api/v1/admin/full-tests/available-stimuli?skill=${skill}`,
    true
  );
  return res.result ?? {};
}

export async function createFullTest(data: {
  title: string;
  skill: string;
  testType?: string;
  duration?: number;
  stimulusIds: number[];
}): Promise<FullTestResponse> {
  const res = await apiClient.post<ApiResponse<FullTestResponse>>('/api/v1/admin/full-tests', data, true);
  if (!res.result) throw new Error('Failed');
  return res.result;
}

export async function autoGenerateFullTest(data: {
  skill: string;
  title?: string;
}): Promise<FullTestResponse> {
  const res = await apiClient.post<ApiResponse<FullTestResponse>>('/api/v1/admin/full-tests/auto', data, true);
  if (!res.result) throw new Error('Failed');
  return res.result;
}

export async function getFullTestById(id: number): Promise<FullTestResponse> {
  const res = await apiClient.get<ApiResponse<FullTestResponse>>(`/api/v1/admin/full-tests/${id}`, true);
  if (!res.result) throw new Error('Failed to fetch full test');
  return res.result;
}

export async function updateFullTest(
  id: number,
  data: {
    title?: string;
    testType?: string;
    duration?: number;
    status?: string;
    skill?: string;
    stimulusIds?: number[];
  }
): Promise<FullTestResponse> {
  const res = await apiClient.put<ApiResponse<FullTestResponse>>(`/api/v1/admin/full-tests/${id}`, data, true);
  if (!res.result) throw new Error('Failed to update full test');
  return res.result;
}

export async function deleteFullTest(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/admin/full-tests/${id}`, true);
}
