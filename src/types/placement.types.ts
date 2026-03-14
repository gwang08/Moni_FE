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
}

export interface PlacementTestPair {
  readingTest: TestDetailResponse;
  listeningTest: TestDetailResponse;
}
