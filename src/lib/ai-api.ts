import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export type WritingTaskType = 'TASK_1' | 'TASK_2';
export type WritingEvaluationStatus = 'PENDING' | 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;

export interface WritingSubmission {
  submissionId: number;
  testId: number | null;
  taskType: WritingTaskType;
  wordCount: number | null;
  evaluationStatus: WritingEvaluationStatus;
  submittedAt: string;
}

export interface WritingSubmissionDetail {
  submissionId: number;
  testId: number | null;
  stimulusId: number | null;
  taskType: WritingTaskType;
  essayContent: string;
  wordCount: number;
  evaluationStatus: WritingEvaluationStatus;
  submittedAt: string;
  evaluation?: {
    overallScore: number;
    analysisResult: Record<string, unknown>;
    feedbackResponse: Record<string, unknown>;
  };
}

export async function getWritingSubmissionDetail(id: number): Promise<WritingSubmissionDetail> {
  const response = await apiClient.get<ApiResponse<WritingSubmissionDetail>>(
    `/api/v1/writing/submissions/${id}`,
    true
  );
  if (!response.result) throw new Error('Không tìm thấy bài viết');
  return response.result;
}

export async function getWritingSubmissions(): Promise<WritingSubmission[]> {
  const response = await apiClient.get<ApiResponse<WritingSubmission[]>>(
    '/api/v1/writing/submissions',
    true
  );
  return response.result ?? [];
}

// Submit writing essay (save without grading immediately)
export async function submitWriting(params: {
  testId: number;
  stimulusId: number;
  taskType: number;
  essayContent: string;
  wordCount: number;
}): Promise<{ submissionId: number }> {
  const response = await apiClient.post<ApiResponse<{ submissionId: number }>>(
    '/api/v1/writing/submit',
    params,
    true
  );
  if (!response.result) throw new Error('Submit writing failed');
  return response.result;
}

function getAuthToken(): string {
  const stored = localStorage.getItem('auth-storage');
  if (!stored) throw new Error('No authentication token found');
  try {
    const { state } = JSON.parse(stored);
    return state?.token || '';
  } catch {
    throw new Error('No authentication token found');
  }
}

// Writing score - multipart form data
export async function scoreWriting(params: {
  taskType: number;
  question: string;
  answer: string;
  chartImage?: File;
  stimulusId?: number;
  submissionId?: number;
}): Promise<Record<string, unknown>> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('taskType', String(params.taskType));
  formData.append('question', params.question);
  formData.append('answer', params.answer);
  if (params.chartImage) {
    formData.append('chartImage', params.chartImage);
  }
  if (params.stimulusId) {
    formData.append('stimulusId', String(params.stimulusId));
  }
  if (params.submissionId) {
    formData.append('submissionId', String(params.submissionId));
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/ai/writing/score`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) throw new Error('Failed to score writing');
  return response.json();
}

// Speaking score - multipart form data
export async function scoreSpeaking(params: {
  audio: File;
  question: string;
}): Promise<Record<string, unknown>> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('audio', params.audio, params.audio.name);
  formData.append('question', params.question);

  console.log('[Speaking Score] audio:', params.audio.name, params.audio.size, 'bytes, type:', params.audio.type);
  console.log('[Speaking Score] question length:', params.question.length);

  const response = await fetch(`${API_BASE_URL}/api/v1/ai/speaking/score`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('[Speaking Score] Error:', response.status, errorBody);
    throw new Error(`Speaking scoring failed (${response.status}): ${errorBody}`);
  }
  return response.json();
}
