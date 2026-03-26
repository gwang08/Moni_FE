import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { SubmitAttemptResponse } from '@/lib/practice-api';

export interface SavedAnswer {
  questionId: number;
  selectedOptionId: number | null;
  answerText: string | null;
}

export interface ExamSession {
  sessionId: number;
  testId: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  startedAt: string;
  durationSeconds: number;
  remainingSeconds: number;
  attemptId: number;
  savedAnswers: SavedAnswer[];
}

interface AnswerPayload {
  questionId: number;
  selectedOptionId?: number;
  answerText?: string;
}

export async function startExam(testId: number): Promise<ExamSession> {
  const res = await apiClient.post<ApiResponse<ExamSession>>(
    '/api/v1/practice/exam/start',
    { testId },
    true
  );
  if (!res.result) throw new Error('Failed to start exam');
  return res.result;
}

export async function getActiveSession(testId: number): Promise<ExamSession | null> {
  try {
    const res = await apiClient.get<ApiResponse<ExamSession>>(
      `/api/v1/practice/exam/active?testId=${testId}`,
      true
    );
    return res.result ?? null;
  } catch {
    return null;
  }
}

export async function saveExamProgress(
  sessionId: number,
  answers: AnswerPayload[]
): Promise<void> {
  await apiClient.put<ApiResponse<void>>(
    '/api/v1/practice/exam/save',
    { sessionId, answers },
    true
  );
}

export async function submitExam(sessionId: number): Promise<SubmitAttemptResponse> {
  const res = await apiClient.post<ApiResponse<SubmitAttemptResponse>>(
    '/api/v1/practice/exam/submit',
    { sessionId },
    true
  );
  if (!res.result) throw new Error('Failed to submit exam');
  return res.result;
}
