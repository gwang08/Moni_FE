import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type {
  TagResponse,
  TagRequest,
  TestImportRequest,
  TestUpdateRequest,
  UserResponse,
  MediaResponse,
} from '@/types/admin.types';
import type { PagedResponse } from '@/types/test.types';

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

// Users
export async function getUsers(
  page = 1,
  size = 20
): Promise<PagedResponse<UserResponse>> {
  const response = await apiClient.get<ApiResponse<PagedResponse<UserResponse>>>(
    `/api/v1/admin/users?page=${page}&size=${size}`,
    true
  );
  if (!response.result) throw new Error('Failed to fetch users');
  return response.result;
}

export async function banUser(userId: string): Promise<void> {
  await apiClient.put(`/api/v1/admin/users/${userId}/ban`, undefined, true);
}

// Media
export async function uploadMedia(file: File): Promise<MediaResponse> {
  const response = await apiClient.upload<ApiResponse<MediaResponse>>(
    '/api/v1/media/upload',
    file
  );
  if (!response.result) throw new Error('Failed to upload media');
  return response.result;
}

export async function getMediaList(): Promise<MediaResponse[]> {
  const response = await apiClient.get<ApiResponse<MediaResponse[]>>(
    '/api/v1/media',
    true
  );
  if (!response.result) throw new Error('Failed to fetch media');
  return response.result;
}

export async function deleteMedia(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/media/${id}`, true);
}
