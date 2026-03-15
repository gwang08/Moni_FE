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
