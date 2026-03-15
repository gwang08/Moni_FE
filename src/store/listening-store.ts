import { create } from 'zustand';
import type { TimestampNote } from '@/types/listening.types';

interface ListeningStore {
  currentTime: number;
  isPlaying: boolean;
  notes: TimestampNote[];
  playbackRate: number;
  volume: number;
  duration: number;
  seekCallback: ((time: number) => void) | null;

  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setDuration: (duration: number) => void;
  addNote: (note: Omit<TimestampNote, 'id'>) => void;
  addNoteAtCurrentTime: (text: string) => void;
  removeNote: (id: string) => void;
  resetPlayer: () => void;
  registerSeekCallback: (cb: ((time: number) => void) | null) => void;
  seekTo: (time: number) => void;
}

export const useListeningStore = create<ListeningStore>((set, get) => ({
  currentTime: 0,
  isPlaying: false,
  notes: [],
  playbackRate: 1,
  volume: 1,
  duration: 0,
  seekCallback: null,

  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setVolume: (volume) => set({ volume }),
  setDuration: (duration) => set({ duration }),

  addNote: (note) =>
    set((state) => ({
      notes: [...state.notes, { ...note, id: `note_${Date.now()}` }],
    })),

  addNoteAtCurrentTime: (text) =>
    set((state) => ({
      notes: [...state.notes, { id: `note_${Date.now()}`, timestamp: state.currentTime, note: text }],
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
      notes: [],
    }),

  registerSeekCallback: (cb) => set({ seekCallback: cb }),

  seekTo: (time) => {
    const { seekCallback } = get();
    if (seekCallback) seekCallback(time);
    set({ currentTime: time });
  },
}));
