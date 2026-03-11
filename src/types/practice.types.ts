export type Skill = 'reading' | 'writing' | 'listening' | 'speaking';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type TestMode = 'PRACTICE' | 'FULL_TEST';

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
}

export interface ExerciseProgress {
  exerciseId: string;
  completed: boolean;
  completedAt?: Date;
  score?: number;
}
