import { create } from 'zustand';
import type { GradingResult } from '@/types/writing.types';

interface WritingStore {
  content: string;
  wordCount: number;
  gradingResult: GradingResult | null;

  setContent: (content: string) => void;
  setWordCount: (count: number) => void;
  submitForGrading: () => void;
}

export const useWritingStore = create<WritingStore>((set, get) => ({
  content: '',
  wordCount: 0,
  gradingResult: null,

  setContent: (content) => set({ content }),
  setWordCount: (count) => set({ wordCount: count }),

  submitForGrading: () => {
    const wordCount = get().wordCount;
    const mockResult: GradingResult = {
      overallBand: Math.min(9, Math.floor(wordCount / 30) + 4),
      taskAchievement: 6.5,
      coherenceCohesion: 7.0,
      lexicalResource: 6.0,
      grammaticalRange: 6.5,
      feedback: 'Bài viết của bạn đã đáp ứng yêu cầu cơ bản.',
    };
    set({ gradingResult: mockResult });
  },
}));
