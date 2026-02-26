export interface OptionDetail {
  id: string;
  content: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuestionDetail {
  id: string;
  content: string;
  questionType: string;
  orderIndex: number;
  options: OptionDetail[];
}

export interface StimulusDetail {
  id: string;
  content: string;
  mediaUrl: string | null;
  orderIndex: number;
  questions: QuestionDetail[];
}

export interface TestDetailResponse {
  id: string;
  title: string;
  description: string;
  testType: string;
  skill: string;
  createdAt: string;
  updatedAt: string;
  stimuli: StimulusDetail[];
}

export interface TestResponse {
  id: string;
  title: string;
  description: string;
  testType: string;
  skill: string;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
