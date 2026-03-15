export interface VocabWord {
  id: number;
  word: string;
  phonetic: string | null;
  pos: string | null;
  definition: string | null;
  example: string | null;
  meaning: string | null;
  audioUrl: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'MASTERED' | 'ARCHIVED';
  collectionName: string | null;
  nextReviewAt: string | null;
  createdAt: string;
}

export interface VocabCollection {
  id: number;
  title: string;
  icon: string | null;
  description: string | null;
  type: 'CUSTOM' | 'BAND' | 'TOPIC';
  isDefault: boolean;
  wordCount: number;
  createdAt: string;
}

export interface VocabSearchResult {
  word: string;
  phonetic: string | null;
  pos: string | null;
  definition: string | null;
  example: string | null;
  meaning: string | null;
  audioUrl: string | null;
  isSaved: boolean;
  dictionaryId: number | null;
}

export interface CuratedWord {
  id: number;
  word: string;
  phonetic: string | null;
  pos: string | null;
  definition: string | null;
  example: string | null;
  meaning: string | null;
  band: string;
  cefrLevel: string;
  topic: string | null;
  audioUrl: string | null;
}

export interface BandSummary {
  band: string;
  cefrLevel: string;
  wordCount: number;
}

export interface TopicSummary {
  topic: string;
  wordCount: number;
}

export interface QuizQuestion {
  id: number;
  type: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  word: string;
  explanation: string | null;
}

export interface QuizResponse {
  questions: QuizQuestion[];
  source: string;
}

export interface ReviewStats {
  totalSaved: number;
  dueToday: number;
  masteredCount: number;
  reviewedToday: number;
}

export interface WordMatchPair {
  word: string;
  definition: string | null;
  meaning: string | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
