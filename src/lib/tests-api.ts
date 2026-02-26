import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { TestResponse, TestDetailResponse, PagedResponse } from '@/types/test.types';

export async function getTests(
  page = 1,
  size = 20,
  skill?: string
): Promise<PagedResponse<TestResponse>> {
  let endpoint = `/api/v1/admin/tests?page=${page}&size=${size}`;
  if (skill) endpoint += `&skill=${skill.toUpperCase()}`;

  const response = await apiClient.get<ApiResponse<PagedResponse<TestResponse>>>(
    endpoint,
    true
  );

  if (!response.result) {
    throw new Error('Failed to fetch tests');
  }

  return response.result;
}

export async function getTestDetail(id: string): Promise<TestDetailResponse> {
  const response = await apiClient.get<ApiResponse<TestDetailResponse>>(
    `/api/v1/admin/tests/${id}`,
    true
  );

  if (!response.result) {
    throw new Error('Failed to fetch test detail');
  }

  return response.result;
}
