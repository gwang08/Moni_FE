export interface ExpertProfile {
  id: number;
  displayName: string;
  avatarUrl: string;
  bandScore: number;
  yearsExperience: number;
  specialization: 'WRITING' | 'SPEAKING' | 'BOTH';
  bio: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  rating: number;
  totalSessions: number;
}

export interface ScoringSession {
  id: number;
  expertId: number;
  expertName: string;
  skill: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  roomUrl: string;
  queuePosition: number;
  content: string;
}

export interface ExpertEvaluation {
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
  strengths: string;
  areasForImprovement: string;
}

export interface CreateExpertRequest {
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string;
  bandScore: number;
  yearsExperience: number;
  specialization: 'WRITING' | 'SPEAKING' | 'BOTH';
  bio: string;
}
