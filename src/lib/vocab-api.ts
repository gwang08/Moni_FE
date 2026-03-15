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

// Deduplicate in-flight requests (prevents React strict mode double-fire)
let inflightKey: string | null = null;
let inflightPromise: Promise<VocabLookupResult> | null = null;

export async function lookupVocab(word: string, sentence?: string, signal?: AbortSignal): Promise<VocabLookupResult> {
  const key = `${word}|${sentence ?? ''}`;

  if (inflightKey === key && inflightPromise) {
    return inflightPromise;
  }

  const params = new URLSearchParams({ word });
  if (sentence) params.set('sentence', sentence);

  inflightKey = key;
  inflightPromise = apiClient.get<ApiResponse<VocabLookupResult>>(
    `/api/v1/vocab/lookup?${params}`,
    false,
    { signal }
  ).then((response) => {
    if (!response.result) throw new Error('Không thể tra từ');
    return response.result;
  }).finally(() => {
    if (inflightKey === key) {
      inflightKey = null;
      inflightPromise = null;
    }
  });

  return inflightPromise;
}
