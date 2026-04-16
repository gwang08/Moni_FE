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
  | 'GAP_FILLING'
  | 'SHORT_ANSWER'
  | 'SPEAKING_PART_1'
  | 'SPEAKING_PART_2'
  | 'SPEAKING_PART_3'
  | 'WRITING_TASK_1'
  | 'WRITING_TASK_2'
  // Writing Task 1 sub-types
  | 'LINE_GRAPH'
  | 'BAR_CHART'
  | 'PIE_CHART'
  | 'TABLE'
  | 'MIXED_GRAPH'
  | 'MAP'
  | 'PROCESS'
  // Writing Task 2 sub-types
  | 'AGREE_DISAGREE'
  | 'DISCUSSION'
  | 'ADVANTAGES_DISADVANTAGES'
  | 'CAUSES_PROBLEMS_SOLUTIONS'
  | 'TWO_PART_QUESTION'
  | 'POSITIVE_NEGATIVE';


// --- Test Import Request (matches backend TestImportRequest DTO) ---

export interface OptionRequest {
  label?: string;
  content: string;
  isCorrect: boolean;
}

export type QuestionCategory = 'MAIN' | 'FOLLOW_UP';

export interface QuestionRequest {
  content: string;
  position?: number;
  questionCategory?: QuestionCategory;
  parentQuestionPosition?: number;
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
  duration?: number;
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
  credit: number | null;
  role: string | null;
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
  position?: number;
  options?: OptionRequest[];
  explanation?: { text?: string; evidence?: string };
  tagIds?: string[];
}

export interface AdminRevenueDashboardResponse {
  startDate: string;
  endDate: string;
  topupRevenue: number;
  topupCount: number;
  expertWritingCredits: number;
  expertWritingJobs: number;
  expertSpeakingCredits: number;
  expertSpeakingJobs: number;
  totalExpertCredits: number;
  totalExpertJobs: number;
  
  // Missing workload metrics: AI
  aiWritingJobs?: number;
  aiSpeakingJobs?: number;
  totalAiJobs?: number;
  totalAiCredits?: number;

  // Additional Operation metrics
  totalTests?: number;
  totalUsers?: number;
  newUsers?: number;
  
  dailyRevenue: DailyRevenue[];
  dailyExpertJobs: DailyExpertJobs[];
}

export interface DailyRevenue {
  date: string;
  amount: number;
}

export interface DailyExpertJobs {
  date: string;
  writingJobs: number;
  speakingJobs: number;
  aiWritingJobs?: number;
  aiSpeakingJobs?: number;
}
