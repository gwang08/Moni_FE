import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';

/**
 * Upload ảnh/audio của user (endpoint public cho user thường, không phải admin).
 * Backend: POST /api/v1/user/media/upload (multipart/form-data, field "file").
 * Trả về URL public của file đã upload.
 */
export async function uploadUserMedia(file: File): Promise<string> {
  const response = await apiClient.upload<ApiResponse<string>>('/api/v1/user/media/upload', file);
  if (!response.result) throw new Error('Upload thất bại');
  return response.result;
}
