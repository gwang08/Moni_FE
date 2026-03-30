import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';

export interface SubmitAttemptRequest {
  testId: number;
  stimulusId: number;
  elapsedSeconds: number;
  answers: { questionId: number; selectedOptionId?: number; answerText?: string }[];
}

export interface AnswerResult {
  questionId: number;
  selectedOptionId: number | null;
  answerText: string | null;
  isCorrect: boolean;
  correctOptionId: number | null;
  correctOptionLabel: string | null;
  correctOptionContent: string | null;
  explanation: string | null;
  evidence: string | null;
}

export interface SubmitAttemptResponse {
  attemptId: number;
  testSessionId: number;
  score: number;
  totalQuestions: number;
  elapsedSeconds: number;
  results: AnswerResult[];
}

export async function submitAttempt(request: SubmitAttemptRequest): Promise<SubmitAttemptResponse> {
  const response = await apiClient.post<ApiResponse<SubmitAttemptResponse>>(
    '/api/v1/practice/submit',
    request,
    true
  );
  if (!response.result) throw new Error('Submit failed');
  return response.result;
}

export interface AttemptHistory {
  attemptId: number;
  testId: number | null;
  testTitle?: string | null;
  testMode?: 'PRACTICE' | 'FULL_TEST' | null;
  stimulusId: number | null;
  stimulusTitle: string | null;
  skill: string | null;
  score: number;
  totalQuestions: number;
  elapsedSeconds: number;
  submittedAt: string;
}

export async function getAttemptHistory(): Promise<AttemptHistory[]> {
  const response = await apiClient.get<ApiResponse<AttemptHistory[]>>(
    '/api/v1/practice/attempts',
    true
  );
  return response.result ?? [];
}

export async function getAttemptResult(attemptId: number): Promise<SubmitAttemptResponse> {
  const response = await apiClient.get<ApiResponse<SubmitAttemptResponse>>(
    `/api/v1/practice/attempts/${attemptId}`,
    true
  );
  if (!response.result) throw new Error('Failed to fetch attempt result');
  return response.result;
}
