import { create } from 'zustand';
import type { Highlight } from '@/types/reading.types';

interface ReadingStore {
  highlights: Highlight[];
  activeTool: 'highlight' | null;
  selectedColor: 'yellow' | 'green' | 'blue';

  addHighlight: (highlight: Omit<Highlight, 'id'>) => void;
  removeHighlight: (id: string) => void;
  setActiveTool: (tool: 'highlight' | null) => void;
  setColor: (color: 'yellow' | 'green' | 'blue') => void;
}

export const useReadingStore = create<ReadingStore>((set) => ({
  highlights: [],
  activeTool: null,
  selectedColor: 'yellow',

  addHighlight: (highlight) =>
    set((state) => ({
      highlights: [...state.highlights, { ...highlight, id: `hl_${Date.now()}` }],
    })),

  removeHighlight: (id) =>
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
    })),

  setActiveTool: (tool) => set({ activeTool: tool }),
  setColor: (color) => set({ selectedColor: color }),
}));
