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
  questionCategory?: string;
  parentQuestionId?: number;
  explanation?: { text?: string; evidence?: string };
  tagIds: number[];
  options: OptionDetail[];
}

export interface QuestionGroupDetail {
  id: number;
  instruction: string;
  questionTypeCode?: string;
  groupContent?: string;
  orderIndex?: number;
  imageUrl?: string;
  sharedOptions?: { label: string; content: string }[];
  questions: QuestionDetail[];
}

export interface StimulusDetail {
  id: number;
  title: string;
  content: string;
  mediaUrl: string | null;
  section: number;
  tagIds?: number[];
  questionGroups: QuestionGroupDetail[];
  transcript?: { id: string; startTime: number; endTime: number; text: string; speaker?: string }[];
}

export interface TestDetailResponse {
  id: number;
  title: string;
  description: string;
  skill: string;
  duration: number | null;
  testMode: string | null;
  section: number | null;
  status: string;
  thumbnailUrl?: string;
  testType?: string;
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
  section: number | null;
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
