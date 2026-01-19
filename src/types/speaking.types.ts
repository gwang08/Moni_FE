export interface SpeakingTask {
  id: string;
  part: 1 | 2 | 3;
  title: string;
  question: string;
  prepTime?: number;
  speakTime: number;
}

export interface Recording {
  id: string;
  taskId: string;
  audioBlob: Blob;
  duration: number;
  transcript?: string;
  feedback?: SpeakingFeedback;
}

export interface SpeakingFeedback {
  fluency: number;
  pronunciation: number;
  vocabulary: number;
  grammar: number;
  overallScore: number;
  comments: string;
}
