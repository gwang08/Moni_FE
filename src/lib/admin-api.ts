import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type {
  TagResponse,
  TagRequest,
  TestImportRequest,
  TestUpdateRequest,
  UserResponse,
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
  await apiClient.post('/api/v1/admin/tests', data, true);
}

export async function updateTest(id: string, data: TestUpdateRequest): Promise<void> {
  await apiClient.put(`/api/v1/admin/tests/${id}`, data, true);
}

export async function deleteTest(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/tests/${id}`, true);
}

// Users - backend: GET /users (returns List<UserProfileResponse>, not paged)
export async function getUsers(): Promise<UserResponse[]> {
  const response = await apiClient.get<ApiResponse<UserResponse[]>>(
    '/users',
    true
  );
  if (!response.result) throw new Error('Failed to fetch users');
  return response.result;
}

export async function banUser(userId: string): Promise<void> {
  await apiClient.put(`/users/${userId}/ban`, undefined, true);
}

// Media - backend: /api/v1/admin/media (upload + delete only, no list endpoint)
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
