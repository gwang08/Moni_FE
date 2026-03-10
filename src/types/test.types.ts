export interface OptionDetail {
  id: number;
  label: string;
  content: string;
  isCorrect: boolean;
}

export interface QuestionDetail {
  id: number;
  content: string;
  position: number;
  explanation?: { text?: string; evidence?: string };
  tagIds: number[];
  options: OptionDetail[];
}

export interface QuestionGroupDetail {
  id: number;
  instruction: string;
  questionTypeCode?: string;
  questions: QuestionDetail[];
}

export interface StimulusDetail {
  id: number;
  title: string;
  content: string;
  mediaUrl: string | null;
  section: number;
  questionGroups: QuestionGroupDetail[];
}

export interface TestDetailResponse {
  id: number;
  title: string;
  description: string;
  skill: string;
  duration: number | null;
  testMode: string | null;
  status: string;
  thumbnailUrl?: string;
  tagIds: number[];
  stimuli: StimulusDetail[];
}

export interface TestResponse {
  id: number;
  title: string;
  description?: string;
  skill: string;
  testType: string;
  duration: number | null;
  testMode: string | null;
  status: string;
  tagIds: number[];
  thumbnailUrl?: string;
  questionCount?: number;
  attemptCount?: number;
  questionTypes?: string[];
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  last: boolean;
}
