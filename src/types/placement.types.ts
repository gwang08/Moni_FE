import type { TestDetailResponse } from '@/types/test.types';

export interface PlacementResult {
  id: number;
  readingBand: number;
  listeningBand: number;
  writingBand: number;
  speakingBand: number;
  overallBand: number;
  targetBand: number;
  readingCorrect: number | null;
  listeningCorrect: number | null;
  isSelfAssessed: boolean;
  completedAt: string;
  writingCriteria?: Record<string, number>;
  speakingCriteria?: Record<string, number>;
  writingFeedback?: Record<string, unknown>;
  speakingFeedback?: Record<string, unknown>;
}

export interface PlacementTestPair {
  readingTest: TestDetailResponse;
  listeningTest: TestDetailResponse;
  writingTest: TestDetailResponse;
  speakingTest: TestDetailResponse;
}
