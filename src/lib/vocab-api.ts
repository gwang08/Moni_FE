import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';

export interface VocabLookupResult {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  explanation: string;
  collocation: string;
  examples: string[];
}

export async function lookupVocab(word: string, sentence?: string, signal?: AbortSignal): Promise<VocabLookupResult> {
  const params = new URLSearchParams({ word });
  if (sentence) params.set('sentence', sentence);

  const response = await apiClient.get<ApiResponse<VocabLookupResult>>(
    `/api/v1/vocab/lookup?${params}`,
    false,
    { signal }
  );
  if (!response.result) {
    throw new Error('Không thể tra từ');
  }
  return response.result;
}
