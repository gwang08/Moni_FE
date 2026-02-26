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

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  dateOfBirth: string;
  isBanned: boolean;
  createdAt: string;
}

export interface MediaResponse {
  id: string;
  fileName: string;
  url: string;
  contentType: string;
  size: number;
  createdAt: string;
}
