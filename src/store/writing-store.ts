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

/* eslint-disable @typescript-eslint/no-explicit-any */
function dig(obj: any, ...paths: string[]): number {
  for (const path of paths) {
    const keys = path.split('.');
    let val: any = obj;
    for (const k of keys) {
      val = val?.[k];
      if (val === undefined) break;
    }
    if (typeof val === 'number') return val;
  }
  return 0;
}

function extractFeedback(data: any): string {
  // Try nested feedback.overall_strategy first
  if (typeof data?.feedback?.overall_strategy === 'string' && data.feedback.overall_strategy) {
    return data.feedback.overall_strategy;
  }
  // Try feedback.improvements array
  if (Array.isArray(data?.feedback?.improvements) && data.feedback.improvements.length > 0) {
    return data.feedback.improvements
      .map((imp: any) => `[${imp.criterion}] ${imp.reason}`)
      .join('\n');
  }
  // Try flat feedback string
  if (typeof data?.feedback === 'string' && data.feedback) return data.feedback;
  if (typeof data?.comment === 'string' && data.comment) return data.comment;
  return 'Bài viết đã được chấm điểm.';
}

function mapApiResponse(data: Record<string, unknown>): GradingResult {
  return {
    overallBand: dig(data,
      'assessment.final_band',
      'overallBand', 'overall_band', 'band', 'score'),
    taskAchievement: dig(data,
      'assessment.criteria.TR.adjusted_band',
      'assessment.criteria.TR.band',
      'taskAchievement', 'task_achievement'),
    coherenceCohesion: dig(data,
      'assessment.criteria.CC.adjusted_band',
      'assessment.criteria.CC.band',
      'coherenceCohesion', 'coherence_cohesion'),
    lexicalResource: dig(data,
      'assessment.criteria.LR.adjusted_band',
      'assessment.criteria.LR.band',
      'lexicalResource', 'lexical_resource'),
    grammaticalRange: dig(data,
      'assessment.criteria.GRA.adjusted_band',
      'assessment.criteria.GRA.band',
      'grammaticalRange', 'grammatical_range'),
    feedback: extractFeedback(data),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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
