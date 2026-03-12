export type Skill = 'reading' | 'writing' | 'listening' | 'speaking';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type TestMode = 'PRACTICE' | 'FULL_TEST';
export type TestType = 'ACADEMIC' | 'GENERAL_TRAINING' | 'BOTH';

export interface Exercise {
  id: string;
  skill: Skill;
  title: string;
  description: string;
  difficulty: Difficulty;
  questionCount?: number;
  duration?: number;
  minWords?: number;
  thumbnailUrl?: string;
  attemptCount?: number;
  questionTypes?: string[];
  testMode?: TestMode;
  testType?: TestType;
}

export interface ExerciseProgress {
  exerciseId: string;
  completed: boolean;
  completedAt?: Date;
  score?: number;
}
