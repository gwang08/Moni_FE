export type TaskType = 'PLACEMENT_TEST' | 'PRACTICE_STIMULUS' | 'MINI_TEST';
export type TaskStatus = 'TODO' | 'DONE' | 'LOCKED';
export type RoadmapSkill = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING';

export interface RoadmapTask {
  id: number;
  order: number;
  taskType: TaskType;
  status: TaskStatus;
  testId: number | null;
  stimulusId: number | null;
  stimulusTitle: string | null;
  questionCount: number | null;
}

export interface RoadmapGoal {
  goalId: number;
  skill: RoadmapSkill;
  startingBand: number;
  targetBand: number;
  deadline: string | null;
  roadmapId: number | null;
  roadmapVersion: number | null;
  tasks: RoadmapTask[];
  progress: number;
}

export interface LearnerTagMetric {
  tagId: number | null;
  tagName: string | null;
  tagCode: string | null;
  tagType: string | null;
  masteryLevel: number | null; // 0..1
  confidenceScore: number | null; // 0..1
  updatedAt: string | null; // ISO
}

export interface LearnerRoadmapInsights {
  examDate: string | null; // YYYY-MM-DD
  daysToExam: number | null;

  targetOverall: number | null;
  targetReading: number | null;
  targetListening: number | null;
  targetWriting: number | null;
  targetSpeaking: number | null;

  placementSelfAssessed: boolean | null;
  placementCompletedAt: string | null; // ISO
  placementOverall: number | null;
  placementReading: number | null;
  placementListening: number | null;
  placementWriting: number | null;
  placementSpeaking: number | null;

  calibratedOverall: number | null;
  calibratedReading: number | null;
  calibratedListening: number | null;
  calibratedWriting: number | null;
  calibratedSpeaking: number | null;
  calibrationNote: string | null;

  masteryIndex: number | null; // 0..1
  confidenceIndex: number | null; // 0..1
  lastMetricUpdatedAt: string | null; // ISO

  achievableOverallByExam: number | null;
  targetOverAmbitious: boolean | null;
  targetWarning: string | null;

  weakestTags: LearnerTagMetric[] | null;
  strongestTags: LearnerTagMetric[] | null;
}
