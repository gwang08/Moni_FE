// ── Exam State Machine ──────────────────────────────────────
export type ExamState =
  | 'IDLE'
  | 'CONNECTING'
  | 'EXAM_READY'
  | 'PART_BRIDGE'
  | 'AUDIO_PLAYING'
  | 'RECORDING'
  | 'PROCESSING'
  | 'PART2_PREP'
  | 'PART2_SPEAKING'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'CONN_ERROR'
  | 'RECONNECTING'
  | 'RESUME';

// ── Server → Client Messages ───────────────────────────────
export interface QuestionEvent {
  type: 'question';
  partNumber: number;
  questionId: number;
  text: string;
  isFollowUp: boolean;
}

export interface CueCardEvent {
  type: 'show_cue_card';
  duration: number;
  questionId: number;
  topic: string;
}

export interface EvaluationFeedback {
  summary: string;
  strengths: string[];
  areas_for_improvement: string[];
  next_steps: string[];
}

export interface EvaluationEvent {
  type: 'evaluation';
  final_band: number;
  fluency: number;
  vocabulary: number;
  grammar: number;
  pronunciation: number;
  criteria?: {
    [key: string]: {
      criterion: string;
      adjusted_band: number;
      strengths: string[];
      weaknesses: string[];
      justification: string;
    };
  };
  feedback: EvaluationFeedback;
  transcript: string;
}

export type ServerMessage =
  | QuestionEvent
  | CueCardEvent
  | { type: 'evaluating' }
  | EvaluationEvent
  | { type: 'error'; message: string }
  | { type: 'heartbeat' };

// ── Client → Server Messages ───────────────────────────────
export type ClientMessage =
  | { type: 'start_exam'; testId: number }
  | { type: 'transcript'; partNumber: number; questionId: number; text: string; audioUrl: string }
  | { type: 'start_speaking_part2' }
  | { type: 'stop_speaking_part2'; text: string; audioUrl: string }
  | { type: 'end_exam' };
