import { create } from 'zustand';
import type { TimestampNote } from '@/types/listening.types';

interface ListeningStore {
  currentTime: number;
  isPlaying: boolean;
  notes: TimestampNote[];
  playbackRate: number;
  volume: number;
  duration: number;

  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setDuration: (duration: number) => void;
  addNote: (note: Omit<TimestampNote, 'id'>) => void;
  removeNote: (id: string) => void;
  resetPlayer: () => void;
}

export const useListeningStore = create<ListeningStore>((set) => ({
  currentTime: 0,
  isPlaying: false,
  notes: [],
  playbackRate: 1,
  volume: 1,
  duration: 0,

  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setVolume: (volume) => set({ volume }),
  setDuration: (duration) => set({ duration }),

  addNote: (note) =>
    set((state) => ({
      notes: [...state.notes, { ...note, id: `note_${Date.now()}` }],
    })),

  removeNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    })),

  resetPlayer: () =>
    set({
      currentTime: 0,
      isPlaying: false,
      playbackRate: 1,
      volume: 1,
      duration: 0,
    }),
}));
