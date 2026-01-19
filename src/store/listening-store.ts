import { create } from 'zustand';
import type { TimestampNote } from '@/types/listening.types';

interface ListeningStore {
  currentTime: number;
  isPlaying: boolean;
  notes: TimestampNote[];

  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  addNote: (note: Omit<TimestampNote, 'id'>) => void;
  removeNote: (id: string) => void;
}

export const useListeningStore = create<ListeningStore>((set) => ({
  currentTime: 0,
  isPlaying: false,
  notes: [],

  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  addNote: (note) =>
    set((state) => ({
      notes: [...state.notes, { ...note, id: `note_${Date.now()}` }],
    })),

  removeNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    })),
}));
