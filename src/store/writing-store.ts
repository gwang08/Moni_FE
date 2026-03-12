import { create } from 'zustand';
import { scoreWriting } from '@/lib/ai-api';
import type { GradingResult } from '@/types/writing.types';

interface WritingStore {
  content: string;
  wordCount: number;
  gradingResult: GradingResult | null;
  isGrading: boolean;
  gradingError: string | null;

  setContent: (content: string) => void;
  setWordCount: (count: number) => void;
  submitForGrading: (params: {
    taskType: number;
    question: string;
    answer: string;
    chartImage?: File;
  }) => Promise<void>;
  clearResult: () => void;
  reset: () => void;
}

function firstNum(data: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const val = data[key];
    if (typeof val === 'number') return val;
  }
  return 0;
}

function firstStr(data: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = data[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return '';
}

function mapApiResponse(data: Record<string, unknown>): GradingResult {
  return {
    overallBand: firstNum(data, 'overallBand', 'overall_band', 'band', 'score'),
    taskAchievement: firstNum(data, 'taskAchievement', 'task_achievement', 'taskResponse', 'task_response'),
    coherenceCohesion: firstNum(data, 'coherenceCohesion', 'coherence_cohesion', 'coherence'),
    lexicalResource: firstNum(data, 'lexicalResource', 'lexical_resource', 'lexical'),
    grammaticalRange: firstNum(data, 'grammaticalRange', 'grammatical_range', 'grammar'),
    feedback: firstStr(data, 'feedback', 'comment', 'remarks') || 'Bài viết đã được chấm điểm.',
  };
}

export const useWritingStore = create<WritingStore>((set) => ({
  content: '',
  wordCount: 0,
  gradingResult: null,
  isGrading: false,
  gradingError: null,

  setContent: (content) => set({ content }),
  setWordCount: (count) => set({ wordCount: count }),

  submitForGrading: async (params) => {
    set({ isGrading: true, gradingError: null });
    try {
      const data = await scoreWriting(params);
      const result = mapApiResponse(data);
      set({ gradingResult: result, isGrading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể chấm bài. Vui lòng thử lại.';
      set({ gradingError: msg, isGrading: false });
    }
  },

  clearResult: () => set({ gradingResult: null, gradingError: null }),

  reset: () => set({
    content: '',
    wordCount: 0,
    gradingResult: null,
    isGrading: false,
    gradingError: null,
  }),
}));
