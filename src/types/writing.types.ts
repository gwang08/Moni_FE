export interface GradingResult {
  overallBand: number;
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  feedback: string;
}

export type WritingTaskType = 1 | 2;

export interface WritingParagraphGuide {
  label: string;
  description: string;
  placeholder: string;
}
