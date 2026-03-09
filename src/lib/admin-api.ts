import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { PagedResponse } from '@/types/test.types';
import type {
  TagResponse,
  TagRequest,
  TestImportRequest,
  TestUpdateRequest,
  UserResponse,
  StimulusCreateRequest,
  StimulusResponse,
  QuestionUpdateRequest,
} from '@/types/admin.types';

// Tags
export async function getTags(): Promise<TagResponse[]> {
  const response = await apiClient.get<ApiResponse<TagResponse[]>>('/api/v1/tags', true);
  if (!response.result) throw new Error('Failed to fetch tags');
  return response.result;
}

export async function createTag(data: TagRequest): Promise<TagResponse> {
  const response = await apiClient.post<ApiResponse<TagResponse>>(
    '/api/v1/tags',
    data,
    true
  );
  if (!response.result) throw new Error('Failed to create tag');
  return response.result;
}

export async function updateTag(id: string, data: TagRequest): Promise<TagResponse> {
  const response = await apiClient.put<ApiResponse<TagResponse>>(
    `/api/v1/tags/${id}`,
    data,
    true
  );
  if (!response.result) throw new Error('Failed to update tag');
  return response.result;
}

export async function deleteTag(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/tags/${id}`, true);
}

// Tests
export async function importTest(data: TestImportRequest): Promise<void> {
  await apiClient.post('/api/v1/admin/tests/import', data, true);
}

export async function updateTest(id: string, data: TestUpdateRequest): Promise<void> {
  await apiClient.put(`/api/v1/admin/tests/${id}`, data, true);
}

export async function deleteTest(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/tests/${id}`, true);
}

// Test Structure
export async function addStimulusToTest(testId: string, data: unknown): Promise<void> {
  await apiClient.post(`/api/v1/admin/tests/${testId}/structure`, data, true);
}

export async function removeStimulusFromTest(testId: string, stimulusId: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/tests/${testId}/structure/${stimulusId}`, true);
}

// Stimuli
export async function createStimulus(data: StimulusCreateRequest): Promise<number> {
  const response = await apiClient.post<ApiResponse<number>>('/api/v1/admin/stimuli', data, true);
  if (!response.result) throw new Error('Failed to create stimulus');
  return response.result;
}

export async function getStimuli(params?: {
  keyword?: string;
  skill?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: string;
}): Promise<PagedResponse<StimulusResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.keyword) searchParams.set('keyword', params.keyword);
  if (params?.skill) searchParams.set('skill', params.skill);
  searchParams.set('page', String(params?.page ?? 0));
  searchParams.set('size', String(params?.size ?? 10));
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.direction) searchParams.set('direction', params.direction);

  const response = await apiClient.get<ApiResponse<PagedResponse<StimulusResponse>>>(
    `/api/v1/admin/stimuli?${searchParams}`,
    true
  );
  if (!response.result) throw new Error('Failed to fetch stimuli');
  return response.result;
}

// Questions
export async function updateQuestion(id: string, data: QuestionUpdateRequest): Promise<void> {
  await apiClient.put(`/api/v1/admin/questions/${id}`, data, true);
}

// Users
export async function getUsers(): Promise<UserResponse[]> {
  const response = await apiClient.get<ApiResponse<UserResponse[]>>('/users', true);
  if (!response.result) throw new Error('Failed to fetch users');
  return response.result;
}

export async function getUserById(userId: string): Promise<UserResponse> {
  const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/${userId}`, true);
  if (!response.result) throw new Error('Failed to fetch user');
  return response.result;
}

export async function banUser(userId: string): Promise<void> {
  await apiClient.put(`/credentials/${userId}/ban`, undefined, true);
}

// Media
export async function uploadMedia(file: File): Promise<string> {
  const response = await apiClient.upload<ApiResponse<string>>(
    '/api/v1/admin/media/upload',
    file
  );
  if (!response.result) throw new Error('Failed to upload media');
  return response.result;
}

export async function deleteMedia(url: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/media?url=${encodeURIComponent(url)}`, true);
}
