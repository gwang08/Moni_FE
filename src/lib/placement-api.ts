import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { PlacementResult, PlacementTestPair } from '@/types/placement.types';

export interface PlacementAnswerItem {
  questionId: number;
  selectedOptionId?: number;
  answerText?: string;
}

export interface SubmitPlacementRequest {
  readingTestId: number;
  listeningTestId: number;
  readingAnswers: PlacementAnswerItem[];
  listeningAnswers: PlacementAnswerItem[];
  writingTestId: number;
  writingEssay: string;
  writingTaskType: number;
  writingStimulusId?: number;
  speakingTestId: number;
  speakingAudioBase64: string;
  targetBand: number;
  elapsedSeconds?: number;
}

export interface SelfAssessPlacementRequest {
  readingBand: number;
  listeningBand: number;
  writingBand: number;
  speakingBand: number;
  targetBand: number;
}

export async function generatePlacement(): Promise<PlacementTestPair> {
  const response = await apiClient.post<ApiResponse<PlacementTestPair>>(
    '/api/v1/placement/generate',
    {},
    true
  );
  if (!response.result) throw new Error('Failed to generate placement test');
  return response.result;
}

export async function submitPlacement(request: SubmitPlacementRequest): Promise<PlacementResult> {
  const response = await apiClient.post<ApiResponse<PlacementResult>>(
    '/api/v1/placement/submit',
    request,
    true
  );
  if (!response.result) throw new Error('Failed to submit placement');
  return response.result;
}

export async function selfAssessPlacement(request: SelfAssessPlacementRequest): Promise<PlacementResult> {
  const response = await apiClient.post<ApiResponse<PlacementResult>>(
    '/api/v1/placement/self-assess',
    request,
    true
  );
  if (!response.result) throw new Error('Failed to self-assess placement');
  return response.result;
}

export async function getPlacementResult(): Promise<PlacementResult | null> {
  const response = await apiClient.get<ApiResponse<PlacementResult>>(
    '/api/v1/placement/result',
    true
  );
  return response.result ?? null;
}

export async function resetPlacement(): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(
    '/api/v1/placement/reset',
    true
  );
}

export interface AiRecommendRequest {
  currentReading: number;
  currentListening: number;
  currentWriting: number;
  currentSpeaking: number;
  currentOverall: number;
  targetReading: number;
  targetListening: number;
  targetWriting: number;
  targetSpeaking: number;
  targetOverall: number;
  examDate: string | null;
}

export interface AiRecommendation {
  recommendedReading: number;
  recommendedListening: number;
  recommendedWriting: number;
  recommendedSpeaking: number;
  recommendedOverall: number;
  analysis: string;
  studyPlan: string;
}

export async function getAiRecommendation(request: AiRecommendRequest): Promise<AiRecommendation> {
  const response = await apiClient.post<ApiResponse<AiRecommendation>>(
    '/api/v1/placement/ai-recommend',
    request,
    true
  );
  if (!response.result) throw new Error('Failed to get AI recommendation');
  return response.result;
}
