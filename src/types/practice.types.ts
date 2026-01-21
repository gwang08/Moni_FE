export type Skill = 'reading' | 'writing' | 'listening' | 'speaking';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Exercise {
  id: string;
  skill: Skill;
  title: string;
  description: string;
  difficulty: Difficulty;
  questionCount?: number; // reading, listening
  duration?: number; // listening (seconds), speaking (seconds)
  minWords?: number; // writing
}

export interface ExerciseProgress {
  exerciseId: string;
  completed: boolean;
  completedAt?: Date;
  score?: number;
}
