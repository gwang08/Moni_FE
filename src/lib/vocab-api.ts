import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type {
  VocabWord,
  VocabCollection,
  VocabSearchResult,
  CuratedWord,
  BandSummary,
  TopicSummary,
  ReviewStats,
  QuizResponse,
  WordMatchPair,
  Page,
} from '@/types/vocab.types';

export interface SentenceTranslateResult {
  translation: string;
  explanation: string;
  keyPoints: string;
}

export interface VocabLookupResult {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  explanation: string;
  collocation: string;
  examples: string[];
  audioUrl?: string;
}

// Deduplicate in-flight requests (prevents React strict mode double-fire)
let inflightKey: string | null = null;
let inflightPromise: Promise<VocabLookupResult> | null = null;
let inflightAborted = false;

export async function lookupVocab(word: string, signal?: AbortSignal): Promise<VocabLookupResult> {
  const key = word;

  if (inflightKey === key && inflightPromise && !inflightAborted) {
    return inflightPromise;
  }

  const params = new URLSearchParams({ word });

  inflightKey = key;
  inflightAborted = false;

  if (signal) {
    signal.addEventListener('abort', () => { inflightAborted = true; }, { once: true });
  }

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

export async function translateSentence(text: string): Promise<SentenceTranslateResult> {
  const res = await apiClient.post<ApiResponse<SentenceTranslateResult>>(
    '/api/v1/vocab/translate-sentence',
    { text },
    false
  );
  if (!res.result) throw new Error('Không thể dịch câu');
  return res.result;
}

// --- Personal words ---

export async function getMyWords(
  page = 0,
  size = 20,
  listId?: number,
  search?: string,
): Promise<Page<VocabWord>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (listId != null) params.set('listId', String(listId));
  if (search) params.set('search', search);
  const res = await apiClient.get<ApiResponse<Page<VocabWord>>>(`/api/v1/vocab/my-words?${params}`, true);
  if (!res.result) throw new Error('Không thể tải từ vựng');
  return res.result;
}

export async function saveWord(word: string, sentence?: string, vocabListId?: number, sourceType?: string): Promise<VocabWord> {
  const body: Record<string, unknown> = { word, sourceType };
  if (sentence) body.sentence = sentence;
  if (vocabListId != null) body.vocabListId = vocabListId;
  const res = await apiClient.post<ApiResponse<VocabWord>>('/api/v1/vocab/save', body, true);
  if (!res.result) throw new Error('Không thể lưu từ');
  return res.result;
}

export async function saveWordManual(data: {
  word: string;
  vocabListId?: number;
  meaning?: string;
  phonetic?: string;
  pos?: string;
  definition?: string;
  example?: string;
  sourceType?: string;
}): Promise<VocabWord> {
  const res = await apiClient.post<ApiResponse<VocabWord>>('/api/v1/vocab/save-manual', data, true);
  if (!res.result) throw new Error('Không thể lưu từ');
  return res.result;
}

export async function deleteWord(id: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/api/v1/vocab/${id}`, true);
}

export async function getVocabDetail(id: number): Promise<VocabDetail> {
  const res = await apiClient.get<ApiResponse<VocabDetail>>(`/api/v1/vocab/${id}/detail`, true);
  if (!res.result) throw new Error('Không thể tải chi tiết từ vựng');
  return res.result;
}

export interface VocabDetail {
  id: number;
  word: string;
  phonetic: string | null;
  pos: string | null;
  definition: string | null;
  example: string | null;
  meaning: string | null;
  audioUrl: string | null;
  status: string;
  collectionName: string | null;
  collocation: string | null;
  explanation: string | null;
  examples: string[] | null;
}

export async function moveWord(id: number, vocabListId: number): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(`/api/v1/vocab/${id}/move`, { vocabListId }, true);
}

// --- Collections ---

export async function getMyLists(): Promise<VocabCollection[]> {
  const res = await apiClient.get<ApiResponse<VocabCollection[]>>('/api/v1/vocab/lists', true);
  if (!res.result) throw new Error('Không thể tải danh sách');
  return res.result;
}

export async function createList(title: string, icon?: string, description?: string): Promise<VocabCollection> {
  const body: Record<string, unknown> = { title };
  if (icon) body.icon = icon;
  if (description) body.description = description;
  const res = await apiClient.post<ApiResponse<VocabCollection>>('/api/v1/vocab/lists', body, true);
  if (!res.result) throw new Error('Không thể tạo danh sách');
  return res.result;
}

export async function updateList(id: number, title?: string, icon?: string, description?: string): Promise<VocabCollection> {
  const body: Record<string, unknown> = {};
  if (title != null) body.title = title;
  if (icon != null) body.icon = icon;
  if (description != null) body.description = description;
  const res = await apiClient.put<ApiResponse<VocabCollection>>(`/api/v1/vocab/lists/${id}`, body, true);
  if (!res.result) throw new Error('Không thể cập nhật danh sách');
  return res.result;
}

export async function deleteList(id: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/api/v1/vocab/lists/${id}`, true);
}

// --- Dictionary search ---

export async function searchWord(q: string): Promise<VocabSearchResult> {
  const params = new URLSearchParams({ q });
  const res = await apiClient.get<ApiResponse<VocabSearchResult>>(`/api/v1/vocab/search?${params}`, false);
  if (!res.result) throw new Error('Không thể tìm từ');
  return res.result;
}

// --- Browse curated words ---

export async function browseCurated(
  page = 0,
  size = 20,
  band?: string,
  topic?: string,
  search?: string,
  pos?: string,
): Promise<Page<CuratedWord>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (band) params.set('band', band);
  if (topic) params.set('topic', topic);
  if (search) params.set('search', search);
  if (pos) params.set('pos', pos);
  const res = await apiClient.get<ApiResponse<Page<CuratedWord>>>(`/api/v1/vocab/browse?${params}`, false);
  if (!res.result) throw new Error('Không thể tải từ vựng');
  return res.result;
}

export async function getBands(): Promise<BandSummary[]> {
  const res = await apiClient.get<ApiResponse<BandSummary[]>>('/api/v1/vocab/browse/bands', false);
  if (!res.result) throw new Error('Không thể tải band');
  return res.result;
}

export async function getTopics(): Promise<TopicSummary[]> {
  const res = await apiClient.get<ApiResponse<TopicSummary[]>>('/api/v1/vocab/browse/topics', false);
  if (!res.result) throw new Error('Không thể tải chủ đề');
  return res.result;
}

// --- Learning ---

export async function getDueReview(limit?: number): Promise<VocabWord[]> {
  const params = limit != null ? `?limit=${limit}` : '';
  const res = await apiClient.get<ApiResponse<VocabWord[]>>(`/api/v1/vocab/due-review${params}`, true);
  if (!res.result) throw new Error('Không thể tải từ cần ôn tập');
  return res.result;
}

export async function submitReview(vocabId: number, quality: number): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(`/api/v1/vocab/${vocabId}/review`, { quality }, true);
}

export async function getReviewStats(): Promise<ReviewStats> {
  const res = await apiClient.get<ApiResponse<ReviewStats>>('/api/v1/vocab/review-stats', true);
  if (!res.result) throw new Error('Không thể tải thống kê');
  return res.result;
}

export async function generateQuiz(
  count?: number,
  source?: string,
  type?: string,
  band?: string,
  topic?: string,
): Promise<QuizResponse> {
  const params = new URLSearchParams();
  if (count != null) params.set('count', String(count));
  if (source) params.set('source', source);
  if (type) params.set('type', type);
  if (band) params.set('band', band);
  if (topic) params.set('topic', topic);
  const query = params.toString() ? `?${params}` : '';
  const res = await apiClient.get<ApiResponse<QuizResponse>>(`/api/v1/vocab/quiz${query}`, true);
  if (!res.result) throw new Error('Không thể tạo quiz');
  return res.result;
}

export async function getWordMatch(
  count?: number,
  source?: string,
  band?: string,
  topic?: string,
): Promise<{ pairs: WordMatchPair[] }> {
  const params = new URLSearchParams();
  if (count != null) params.set('count', String(count));
  if (source) params.set('source', source);
  if (band) params.set('band', band);
  if (topic) params.set('topic', topic);
  const query = params.toString() ? `?${params}` : '';
  const res = await apiClient.get<ApiResponse<{ pairs: WordMatchPair[] }>>(`/api/v1/vocab/word-match${query}`, true);
  if (!res.result) throw new Error('Không thể tải ghép từ');
  return res.result;
}
