import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';

export interface TranscriptEntry {
  id: number;
  scoringSessionId: number;
  speakerName: string;
  speakerRole: 'EXPERT' | 'LEARNER' | string;
  text: string;
  language: string;
  spokenAt: string; // ISO LocalDateTime from backend
}

export interface TranscriptCreateEntry {
  text: string;
  language?: string;
  spokenAt?: string; // ISO LocalDateTime; backend defaults to now if absent
}

/** Append a batch of finalized captions to a scoring session. */
export async function appendSessionTranscripts(
  sessionId: number,
  entries: TranscriptCreateEntry[],
): Promise<TranscriptEntry[]> {
  if (!entries.length) return [];
  const res = await apiClient.post<ApiResponse<TranscriptEntry[]>>(
    `/api/v1/scoring-sessions/${sessionId}/transcripts`,
    { entries },
    true,
  );
  return res.result ?? [];
}

/** Fetch full transcript for a scoring session, ordered by spokenAt ASC. */
export async function getSessionTranscripts(sessionId: number): Promise<TranscriptEntry[]> {
  const res = await apiClient.get<ApiResponse<TranscriptEntry[]>>(
    `/api/v1/scoring-sessions/${sessionId}/transcripts`,
    true,
  );
  return res.result ?? [];
}
