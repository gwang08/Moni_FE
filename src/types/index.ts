export interface TargetScores {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

export interface Activity {
  id: string;
  date: string;
  skill: keyof TargetScores;
  duration: number;
}

export type SkillKey = keyof TargetScores;
