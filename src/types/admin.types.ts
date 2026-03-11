export enum TagType {
  SKILL = 'SKILL',
  TOPIC = 'TOPIC',
  DIFFICULTY = 'DIFFICULTY',
  CUSTOM = 'CUSTOM',
}

export interface TagResponse {
  id: string;
  name: string;
  type: TagType;
  description: string | null;
  createdAt: string;
}

export interface TagRequest {
  name: string;
  type: TagType;
  description?: string;
}

// --- Question Type Codes matching backend QuestionType enum ---
export type QuestionTypeCode =
  | 'MCQ'
  | 'MCQ_MULTIPLE'
  | 'TFNG'
  | 'YNNG'
  | 'MATCHING_HEADINGS'
  | 'MATCHING_INFORMATION'
  | 'MATCHING_FEATURE'
  | 'DIAGRAM_LABEL'
  | 'GAP_FILLING';


// --- Test Import Request (matches backend TestImportRequest DTO) ---

export interface OptionRequest {
  label?: string;
  content: string;
  isCorrect: boolean;
}

export interface QuestionRequest {
  content: string;
  position?: number;
  metadata?: Record<string, unknown>;
  explanation?: { text?: string; evidence?: string };
  tagIds?: number[];
  options: OptionRequest[];
}

export interface QuestionGroupRequest {
  instruction?: string;
  questionTypeCode: QuestionTypeCode;
  groupContent?: string;
  imageUrl?: string;
  sharedOptions?: { label: string; content: string }[];
  questions: QuestionRequest[];
}

export interface StimulusRequest {
  title: string;
  content: string;
  mediaUrl?: string;
  section?: number;
  questionGroups: QuestionGroupRequest[];
}

export interface TestImportRequest {
  title: string;
  description?: string;
  skill: string;
  testType?: string;
  testMode?: string;
  section?: number | null;
  thumbnailUrl?: string;
  tagIds?: number[];
  stimuli: StimulusRequest[];
}

export interface TestUpdateRequest {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  testType?: string;
  duration?: number;
  skill?: string;
  testMode?: string;
  section?: number | null;
  status?: string;
  tagIds?: number[];
}

// Matches backend UserProfileResponse (snake_case fields)
export interface UserResponse {
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  targetBand: number | null;
}

export interface StimulusCreateRequest {
  title: string;
  content: string;
  mediaUrl?: string;
  section?: number;
  questionGroups: QuestionGroupRequest[];
}

export interface StimulusResponse {
  id: number;
  content: string;
  mediaUrl: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface QuestionUpdateRequest {
  content?: string;
  questionType?: string;
  orderIndex?: number;
  options?: OptionRequest[];
  explanation?: { text?: string; evidence?: string };
  tagIds?: string[];
}
