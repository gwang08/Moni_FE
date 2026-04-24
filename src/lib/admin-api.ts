import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { PagedResponse } from '@/types/test.types';
import type { CreditTransactionResponse } from '@/types/payment.types';
import type { ScoringSession, ExpertEvaluation } from '@/types/expert.types';
import type { AttemptHistory } from '@/lib/practice-api';
import type { WritingSubmission } from '@/lib/ai-api';
import type {
  LearnerRoadmapInsights,
  WeeklyPlanResponse,
  WeeklyPlanSummary,
} from '@/types/roadmap.types';
import type {
  TagResponse,
  TagRequest,
  TestImportRequest,
  TestUpdateRequest,
  UserResponse,
  StimulusCreateRequest,
  StimulusResponse,
  QuestionUpdateRequest,
  QuestionGroupRequest,
  QuestionRequest,
  AdminRevenueDashboardResponse,
} from '@/types/admin.types';

// Tags
export async function getTags(): Promise<TagResponse[]> {
  const response = await apiClient.get<ApiResponse<TagResponse[]>>('/api/v1/tags', true);
  if (!response.result) throw new Error('Failed to fetch tags');
  return response.result;
}

export async function createTag(data: TagRequest): Promise<TagResponse> {
  const response = await apiClient.post<ApiResponse<TagResponse>>(
    '/api/v1/tags',
    data,
    true
  );
  if (!response.result) throw new Error('Failed to create tag');
  return response.result;
}

export async function updateTag(id: number | string, data: TagRequest): Promise<TagResponse> {
  const response = await apiClient.put<ApiResponse<TagResponse>>(
    `/api/v1/tags/${id}`,
    data,
    true
  );
  if (!response.result) throw new Error('Failed to update tag');
  return response.result;
}

export async function deleteTag(id: number | string): Promise<void> {
  await apiClient.delete(`/api/v1/tags/${id}`, true);
}

// Tests
export async function importTest(data: TestImportRequest): Promise<number> {
  const response = await apiClient.post<ApiResponse<number>>('/api/v1/admin/tests/import', data, true);
  if (!response.result) throw new Error('Failed to import test');
  return response.result;
}

export async function updateTest(id: string, data: TestUpdateRequest): Promise<void> {
  await apiClient.put(`/api/v1/admin/tests/${id}`, data, true);
}

export async function deleteTest(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/tests/${id}`, true);
}

// Test Structure
export async function addStimulusToTest(testId: string, data: unknown): Promise<void> {
  await apiClient.post(`/api/v1/admin/tests/${testId}/structure`, data, true);
}

export async function removeStimulusFromTest(testId: string, stimulusId: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/tests/${testId}/structure/${stimulusId}`, true);
}

// Stimuli
export async function createStimulus(data: StimulusCreateRequest): Promise<number> {
  const response = await apiClient.post<ApiResponse<number>>('/api/v1/admin/stimuli', data, true);
  if (!response.result) throw new Error('Failed to create stimulus');
  return response.result;
}

export async function getStimuli(params?: {
  keyword?: string;
  skill?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: string;
}): Promise<PagedResponse<StimulusResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.keyword) searchParams.set('keyword', params.keyword);
  if (params?.skill) searchParams.set('skill', params.skill);
  searchParams.set('page', String(params?.page ?? 0));
  searchParams.set('size', String(params?.size ?? 10));
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.direction) searchParams.set('direction', params.direction);

  const response = await apiClient.get<ApiResponse<PagedResponse<StimulusResponse>>>(
    `/api/v1/admin/stimuli?${searchParams}`,
    true
  );
  if (!response.result) throw new Error('Failed to fetch stimuli');
  return response.result;
}

export async function updateStimulus(id: number, data: { content?: string; mediaUrl?: string; transcript?: unknown; visonAnalysisResult?: Record<string, unknown>; tagIds?: number[] }): Promise<void> {
  await apiClient.put(`/api/v1/admin/stimuli/${id}`, data, true);
}

export async function deleteStimulus(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/admin/stimuli/${id}`, true);
}

// Chart Analysis (Writing Task 1)
export async function analyzeChart(stimulusId: number, chartImage: File): Promise<Record<string, unknown>> {
  const formData = new FormData();
  formData.append('chartImage', chartImage);
  const response = await apiClient.request<ApiResponse<Record<string, unknown>>>(`/api/v1/admin/stimuli/${stimulusId}/analyze-chart`, {
    method: 'POST',
    requiresAuth: true,
    body: formData,
  });
  // apiClient.request returns the raw response; extract result
  const res = response as unknown as ApiResponse<Record<string, unknown>>;
  return res.result ?? {};
}

export async function getVisonAnalysis(stimulusId: number): Promise<Record<string, unknown> | null> {
  const response = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/api/v1/admin/stimuli/${stimulusId}/vison-analysis`, true);
  return response.result ?? null;
}

export async function updateVisonAnalysis(stimulusId: number, data: Record<string, unknown>): Promise<void> {
  await apiClient.put(`/api/v1/admin/stimuli/${stimulusId}/vison-analysis`, data, true);
}

export async function transcribeByUrl(audioUrl: string): Promise<{ id: string; startTime: number; endTime: number; text: string; speaker?: string }[]> {
  const response = await apiClient.post<ApiResponse<{ id: string; startTime: number; endTime: number; text: string; speaker?: string }[]>>(
    '/api/v1/admin/stimuli/transcribe-url',
    { audioUrl },
    true
  );
  if (!response.result) throw new Error('Failed to transcribe');
  return response.result;
}

export async function transcribeStimulus(stimulusId: number): Promise<{ id: string; startTime: number; endTime: number; text: string; speaker?: string }[]> {
  const response = await apiClient.post<ApiResponse<{ id: string; startTime: number; endTime: number; text: string; speaker?: string }[]>>(
    `/api/v1/admin/stimuli/${stimulusId}/transcribe`,
    {},
    true
  );
  if (!response.result) throw new Error('Failed to transcribe');
  return response.result;
}

export async function getTranscript(stimulusId: number): Promise<{ id: string; startTime: number; endTime: number; text: string; speaker?: string }[]> {
  const response = await apiClient.get<ApiResponse<{ id: string; startTime: number; endTime: number; text: string; speaker?: string }[]>>(
    `/api/v1/admin/stimuli/${stimulusId}/transcript`,
    true
  );
  if (!response.result) throw new Error('Failed to get transcript');
  return response.result;
}

// Questions
export async function updateQuestion(id: string, data: QuestionUpdateRequest): Promise<void> {
  await apiClient.put(`/api/v1/admin/questions/${id}`, data, true);
}

export async function batchUpdateQuestions(updates: Record<string, QuestionUpdateRequest>): Promise<void> {
  await apiClient.put('/api/v1/admin/questions/batch', updates, true);
}

export async function createQuestionGroup(stimulusId: number, data: QuestionGroupRequest): Promise<number> {
  const response = await apiClient.post<ApiResponse<number>>(
    `/api/v1/admin/stimuli/${stimulusId}/question-groups`, data, true
  );
  if (!response.result) throw new Error('Failed to create question group');
  return response.result;
}

export async function deleteQuestionGroup(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/admin/question-groups/${id}`, true);
}

export async function updateQuestionGroupImageUrl(groupId: number, imageUrl: string): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(`/api/v1/admin/question-groups/${groupId}/image-url`, { imageUrl }, true);
}

export async function updateQuestionGroupContent(groupId: number, groupContent: string): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(`/api/v1/admin/question-groups/${groupId}/group-content`, { groupContent }, true);
}

export async function updateQuestionGroupInstruction(groupId: number, instruction: string): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(`/api/v1/admin/question-groups/${groupId}/instruction`, { instruction }, true);
}

export async function updateQuestionGroupTypeCode(groupId: number, questionTypeCode: string): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(`/api/v1/admin/question-groups/${groupId}/question-type-code`, { questionTypeCode }, true);
}

export async function updateQuestionGroupOrderIndex(groupId: number, orderIndex: number): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(`/api/v1/admin/question-groups/${groupId}/order-index`, { orderIndex }, true);
}

export async function createQuestion(groupId: number, data: QuestionRequest): Promise<number> {
  const response = await apiClient.post<ApiResponse<number>>(
    `/api/v1/admin/question-groups/${groupId}/questions`, data, true
  );
  if (!response.result) throw new Error('Failed to create question');
  return response.result;
}

export async function deleteQuestion(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/admin/questions/${id}`, true);
}

// Users
export async function getUsers(): Promise<UserResponse[]> {
  const response = await apiClient.get<ApiResponse<UserResponse[]>>('/users', true);
  if (!response.result) throw new Error('Failed to fetch users');
  return response.result;
}

export async function getUserById(userId: string): Promise<UserResponse> {
  const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/${userId}`, true);
  if (!response.result) throw new Error('Failed to fetch user');
  return response.result;
}

export async function banUser(userId: string): Promise<void> {
  await apiClient.put(`/credentials/${userId}/ban`, undefined, true);
}

// Admin User Detail — xem chi tiết 1 học viên (practice / writing / expert / roadmap)
export async function getAdminUserAttempts(userId: string): Promise<AttemptHistory[]> {
  const res = await apiClient.get<ApiResponse<AttemptHistory[]>>(`/users/${userId}/attempts`, true);
  return res.result ?? [];
}

export async function getAdminUserWritingSubmissions(userId: string): Promise<WritingSubmission[]> {
  const res = await apiClient.get<ApiResponse<WritingSubmission[]>>(`/users/${userId}/writing-submissions`, true);
  return res.result ?? [];
}

export async function getAdminUserScoringSessions(userId: string): Promise<ScoringSession[]> {
  const res = await apiClient.get<ApiResponse<ScoringSession[]>>(`/users/${userId}/scoring-sessions`, true);
  return res.result ?? [];
}

export async function getAdminUserRoadmapInsights(userId: string): Promise<LearnerRoadmapInsights | null> {
  const res = await apiClient.get<ApiResponse<LearnerRoadmapInsights>>(`/users/${userId}/roadmap-insights`, true);
  return res.result ?? null;
}

export async function getAdminUserWeeklyPlan(userId: string): Promise<WeeklyPlanResponse | null> {
  const res = await apiClient.get<ApiResponse<WeeklyPlanResponse>>(`/users/${userId}/weekly-plan`, true);
  return res.result ?? null;
}

export async function getAdminUserWeeklyPlanHistory(userId: string): Promise<WeeklyPlanSummary[]> {
  const res = await apiClient.get<ApiResponse<WeeklyPlanSummary[]>>(`/users/${userId}/weekly-plan-history`, true);
  return res.result ?? [];
}

// Media
export async function uploadMedia(file: File): Promise<string> {
  const response = await apiClient.upload<ApiResponse<string>>(
    '/api/v1/admin/media/upload',
    file
  );
  if (!response.result) throw new Error('Failed to upload media');
  return response.result;
}

export async function deleteMedia(url: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/media?url=${encodeURIComponent(url)}`, true);
}

export async function urlToFile(url: string, filename: string, mimeType: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType });
}

export async function getAdminRevenueDashboard(params?: {
  fromDate?: string;
  toDate?: string;
}): Promise<AdminRevenueDashboardResponse> {
  const searchParams = new URLSearchParams();
  if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params?.toDate) searchParams.set('toDate', params.toDate);

  const query = searchParams.toString();
  const response = await apiClient.get<ApiResponse<AdminRevenueDashboardResponse>>(
    `/api/v1/admin/dashboard/revenue${query ? `?${query}` : ''}`,
    true
  );
  if (!response.result) throw new Error('Failed to fetch admin revenue dashboard');
  return response.result;
}

export async function getAdminCreditTransactions(params?: {
  userId?: string;
  paymentType?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<CreditTransactionResponse[]> {
  const searchParams = new URLSearchParams();
  const normalizedUserId = params?.userId?.trim();
  if (normalizedUserId) searchParams.set('userId', normalizedUserId);
  if (params?.paymentType && params.paymentType !== 'ALL') searchParams.set('paymentType', params.paymentType);
  if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params?.toDate) searchParams.set('toDate', params.toDate);

  const query = searchParams.toString();
  const response = await apiClient.get<ApiResponse<CreditTransactionResponse[]> | CreditTransactionResponse[]>(
    `/api/v1/admin/credit-transactions${query ? `?${query}` : ''}`,
    true
  );

  // Compatibility: accept both wrapped ApiResponse and bare array responses.
  if (Array.isArray(response)) return response;
  return response.result ?? [];
}

export async function getScoringSessionById(id: number): Promise<ScoringSession> {
  const response = await apiClient.get<ApiResponse<ScoringSession>>(`/api/v1/scoring-sessions/${id}`, true);
  if (!response.result) throw new Error('Failed to fetch scoring session');
  return response.result;
}

export async function getScoringSessionEvaluation(id: number): Promise<ExpertEvaluation> {
  const response = await apiClient.get<ApiResponse<ExpertEvaluation>>(`/api/v1/scoring-sessions/${id}/evaluation`, true);
  if (!response.result) throw new Error('Failed to fetch scoring session evaluation');
  return response.result;
}

// ─── Prompt Management ────────────────────────────────────────────────────────

export interface PromptInfo {
  skill: string;
  filename: string;
  path: string;
  activeVersion: string;
  availableVersions: string[];
}

export interface PromptDetail {
  skill: string;
  filename: string;
  activeVersion: string;
  content: string;
}

export interface PromptVersionDetail {
  skill: string;
  filename: string;
  version: string;
  content: string;
}

export async function listAllPrompts(): Promise<PromptInfo[]> {
  const response = await apiClient.get<PromptInfo[] | ApiResponse<PromptInfo[]>>(
    '/api/v1/admin/prompts',
    true
  );
  if (Array.isArray(response)) return response;
  return (response as ApiResponse<PromptInfo[]>).result ?? [];
}

export async function getPromptDetail(skill: string, filename: string): Promise<PromptDetail> {
  const response = await apiClient.get<PromptDetail>(
    `/api/v1/admin/prompts/${skill}/${filename}`,
    true
  );
  return response;
}

export async function getPromptVersionContent(
  skill: string,
  filename: string,
  version: string
): Promise<PromptVersionDetail> {
  const response = await apiClient.get<PromptVersionDetail>(
    `/api/v1/admin/prompts/${skill}/${filename}/versions/${version}`,
    true
  );
  return response;
}

export async function updatePrompt(
  skill: string,
  filename: string,
  content: string,
  activateImmediately: boolean
): Promise<{ newVersion: string; activated: boolean; message: string }> {
  const response = await apiClient.put<{ newVersion: string; activated: boolean; message: string }>(
    `/api/v1/admin/prompts/${skill}/${filename}`,
    { content, activateImmediately },
    true
  );
  return response;
}

export async function activatePromptVersion(
  skill: string,
  filename: string,
  version: string
): Promise<{ activeVersion: string; message: string }> {
  const response = await apiClient.put<{ activeVersion: string; message: string }>(
    `/api/v1/admin/prompts/${skill}/${filename}/activate/${version}`,
    {},
    true
  );
  return response;
}
