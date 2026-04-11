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

// =====================================================================
// Weekly Plan Types (new system)
// =====================================================================

export type SlotTaskType = 'PRACTICE' | 'ASSESSMENT';
export type SlotStatus = 'TODO' | 'DONE';
export type PerformanceVerdict = 'IMPROVED' | 'STABLE' | 'DECLINED';

export interface DailySlotResponse {
  id: number;
  dayOfWeek: number;
  slotDate: string;
  skill: RoadmapSkill;
  taskType: SlotTaskType;
  stimulusId: number | null;
  stimulusTitle: string | null;
  testId: number | null;
  status: SlotStatus;
  score: number | null;
  totalQuestions: number | null;
}

export interface WeeklyPlanResponse {
  id: number;
  weekNumber: number;
  monthCycle: number;
  weekInMonth: number;
  weekStartDate: string;
  weekEndDate: string;
  status: 'ACTIVE' | 'COMPLETED';
  difficultyLevel: number;
  weeklyAccuracy: number | null;
  completionRate: number | null;
  performanceVerdict: PerformanceVerdict | null;
  previousVerdict: PerformanceVerdict | null;
  slots: DailySlotResponse[];
  todayCompleted: boolean;
  suggestVocabulary: boolean;
  monthlyAssessmentPending: boolean;
}

export interface WeeklyPlanSummary {
  weekNumber: number;
  monthCycle: number;
  weekInMonth: number;
  weekStartDate: string;
  weekEndDate: string;
  weeklyAccuracy: number | null;
  completionRate: number | null;
  performanceVerdict: string | null;
}

export interface MonthlyAssessmentResponse {
  id: number;
  monthCycle: number;
  fullTestId: number | null;
  status: 'PENDING' | 'COMPLETED';
  readingBand: number | null;
  listeningBand: number | null;
  writingBand: number | null;
  speakingBand: number | null;
  overallBand: number | null;
}
