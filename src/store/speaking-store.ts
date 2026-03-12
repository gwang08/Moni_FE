import { create } from 'zustand';
import { scoreSpeaking } from '@/lib/ai-api';
import type { Recording, SpeakingFeedback } from '@/types/speaking.types';

// Detects placeholder/not-implemented response from backend
function isPlaceholderResponse(data: Record<string, unknown>): boolean {
  const str = JSON.stringify(data).toLowerCase();
  return (
    str.includes('placeholder') ||
    str.includes('not implemented') ||
    str.includes('coming soon') ||
    str.includes('developing') ||
    Object.keys(data).length === 0
  );
}

interface SpeakingStore {
  isRecording: boolean;
  currentRecording: Recording | null;
  recordings: Recording[];
  currentQuestionIndex: number;
  notes: string;
  isScoring: boolean;
  scoringError: string | null;

  startRecording: () => void;
  stopRecording: (audioBlob: Blob, duration: number, taskId: string) => void;
  addFeedback: (recordingId: string, feedback: SpeakingFeedback) => void;
  clearRecording: () => void;
  setCurrentQuestionIndex: (index: number) => void;
  setNotes: (notes: string) => void;
  submitForScoring: (audio: File, question: string) => Promise<void>;
  reset: () => void;
}

const DEFAULT_STATE = {
  isRecording: false,
  currentRecording: null,
  recordings: [] as Recording[],
  currentQuestionIndex: 0,
  notes: '',
  isScoring: false,
  scoringError: null,
};

export const useSpeakingStore = create<SpeakingStore>((set, get) => ({
  ...DEFAULT_STATE,

  startRecording: () => set({ isRecording: true }),

  stopRecording: (audioBlob, duration, taskId) => {
    const recording: Recording = {
      id: `rec_${Date.now()}`,
      taskId,
      audioBlob,
      duration,
    };
    set((state) => ({
      isRecording: false,
      currentRecording: recording,
      recordings: [...state.recordings, recording],
    }));
  },

  addFeedback: (recordingId, feedback) =>
    set((state) => ({
      recordings: state.recordings.map((rec) =>
        rec.id === recordingId ? { ...rec, feedback } : rec
      ),
      currentRecording:
        state.currentRecording?.id === recordingId
          ? { ...state.currentRecording, feedback }
          : state.currentRecording,
    })),

  clearRecording: () => set({ currentRecording: null }),

  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

  setNotes: (notes) => set({ notes }),

  submitForScoring: async (audio, question) => {
    set({ isScoring: true, scoringError: null });
    try {
      const data = await scoreSpeaking({ audio, question });
      if (isPlaceholderResponse(data)) {
        set({ scoringError: 'PLACEHOLDER' });
        return;
      }
      // Map response to SpeakingFeedback if valid
      const feedback: SpeakingFeedback = {
        fluency: Number(data.fluency) || 0,
        pronunciation: Number(data.pronunciation) || 0,
        vocabulary: Number(data.vocabulary) || 0,
        grammar: Number(data.grammar) || 0,
        overallScore: Number(data.overallScore ?? data.overall_score) || 0,
        comments: String(data.comments ?? data.comment ?? ''),
      };
      const { currentRecording, addFeedback } = get();
      if (currentRecording) {
        addFeedback(currentRecording.id, feedback);
      }
    } catch {
      set({ scoringError: 'PLACEHOLDER' });
    } finally {
      set({ isScoring: false });
    }
  },

  reset: () => set({ ...DEFAULT_STATE, recordings: [] }),
}));
