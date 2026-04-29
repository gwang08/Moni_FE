import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/auth.types';

/**
 * Upload audio/media blob qua endpoint user-scope.
 * Dùng chung cho Speaking AI và Expert call recording.
 * Trả về public URL của file đã upload.
 */
export async function uploadUserMedia(blob: Blob, filename = 'audio.webm'): Promise<string> {
  const file = blob instanceof File ? blob : new File([blob], filename, { type: blob.type || 'audio/webm' });
  const response = await apiClient.upload<ApiResponse<string>>('/api/v1/user/media/upload', file);
  if (!response.result) throw new Error('Failed to upload media');
  return response.result;
}
