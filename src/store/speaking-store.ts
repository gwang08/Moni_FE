import { create } from 'zustand';
import type { Recording, SpeakingFeedback } from '@/types/speaking.types';

interface SpeakingStore {
  isRecording: boolean;
  currentRecording: Recording | null;
  recordings: Recording[];

  startRecording: () => void;
  stopRecording: (audioBlob: Blob, duration: number, taskId: string) => void;
  addFeedback: (recordingId: string, feedback: SpeakingFeedback) => void;
  clearRecording: () => void;
}

export const useSpeakingStore = create<SpeakingStore>((set) => ({
  isRecording: false,
  currentRecording: null,
  recordings: [],

  startRecording: () => set({ isRecording: true }),

  stopRecording: (audioBlob, duration, taskId) => {
    const recording: Recording = {
      id: `rec_${Date.now()}`,
      taskId,
      audioBlob,
      duration,
      transcript: 'Thank you for answering this question. Your response has been recorded.',
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
}));
