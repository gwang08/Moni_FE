export interface ExpertProfile {
  id: number;
  displayName: string;
  email?: string;
  avatarUrl: string;
  bandScore: number;
  bandReading: number;
  bandListening: number;
  bandWriting: number;
  bandSpeaking: number;
  yearsExperience: number;
  specialization: 'WRITING' | 'SPEAKING' | 'BOTH';
  bio: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  rating: number;
  totalSessions: number;
  certificates?: string[];
}

export interface ScoringSession {
  id: number;
  expertId: number;
  expertDisplayName: string;
  userDisplayName?: string | null;
  skill: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  roomUrl: string;
  roomName?: string;
  queuePosition: number;
  content?: string;
  createdAt?: string;
  startedAt?: string;
  endedAt?: string;
  testId?: number;
  writingSubmissionId?: number;
  submittedAt?: string;
  recordingUrl?: string;
  expertRecordingUrl?: string;
  userRating?: number;
}

export interface ExpertEvaluation {
  id: number;
  skill: string;
  overallScore: number;
  // Speaking criteria
  fluency?: number;
  vocabulary?: number;
  grammar?: number;
  pronunciation?: number;
  // Writing criteria
  taskResponse?: number;
  coherence?: number;
  lexicalResource?: number;
  grammaticalRange?: number;
  feedback: string;
  strengths?: string;
  areasForImprovement?: string;
  expertName?: string;
  createdAt: string;
}

export interface CreateExpertRequest {
  email: string;
  displayName: string;
  avatarUrl?: string;
  bandReading?: number;
  bandListening?: number;
  bandWriting?: number;
  bandSpeaking?: number;
  yearsExperience: number;
  bio: string;
  certificates?: string[];
}

export interface UpdateExpertRequest {
  displayName?: string;
  avatarUrl?: string;
  bandReading?: number;
  bandListening?: number;
  bandWriting?: number;
  bandSpeaking?: number;
  yearsExperience?: number;
  bio?: string;
  certificates?: string[];
}
