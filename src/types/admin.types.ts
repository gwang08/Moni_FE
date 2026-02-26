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

export interface StimulusRequest {
  content: string;
  mediaUrl?: string;
  orderIndex: number;
  questions: QuestionRequest[];
}

export interface QuestionRequest {
  content: string;
  questionType: string;
  orderIndex: number;
  options: OptionRequest[];
}

export interface OptionRequest {
  content: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface TestImportRequest {
  title: string;
  description: string;
  testType: string;
  skill: string;
  tagIds?: string[];
  stimuli: StimulusRequest[];
}

export interface TestUpdateRequest {
  title?: string;
  description?: string;
  testType?: string;
  tagIds?: string[];
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
