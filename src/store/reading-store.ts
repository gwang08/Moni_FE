import { create } from 'zustand';
import type { Highlight, VocabItem } from '@/types/reading.types';

type ActiveTool = 'highlight' | 'note' | 'vocab' | null;
type Mode = 'practice' | 'exam';

interface ReadingStore {
  highlights: Highlight[];
  vocabList: VocabItem[];
  activeTool: ActiveTool;
  selectedColor: 'yellow' | 'green' | 'blue';
  mode: Mode;
  editingHighlightId: string | null;

  addHighlight: (highlight: Omit<Highlight, 'id'>) => void;
  removeHighlight: (id: string) => void;
  addNote: (highlightId: string, note: string) => void;
  addVocab: (vocab: Omit<VocabItem, 'id'>) => void;
  removeVocab: (id: string) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setColor: (color: 'yellow' | 'green' | 'blue') => void;
  setMode: (mode: Mode) => void;
  setEditingHighlightId: (id: string | null) => void;
  clearAll: () => void;
}

export const useReadingStore = create<ReadingStore>((set) => ({
  highlights: [],
  vocabList: [],
  activeTool: null,
  selectedColor: 'yellow',
  mode: 'practice',
  editingHighlightId: null,

  addHighlight: (highlight) =>
    set((state) => ({
      highlights: [...state.highlights, { ...highlight, id: `hl_${Date.now()}` }],
    })),

  removeHighlight: (id) =>
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
      vocabList: state.vocabList.filter((v) => v.highlightId !== id),
    })),

  addNote: (highlightId, note) =>
    set((state) => ({
      highlights: state.highlights.map((h) =>
        h.id === highlightId ? { ...h, note } : h
      ),
      editingHighlightId: null,
    })),

  addVocab: (vocab) =>
    set((state) => ({
      vocabList: [...state.vocabList, { ...vocab, id: `voc_${Date.now()}` }],
    })),

  removeVocab: (id) =>
    set((state) => ({
      vocabList: state.vocabList.filter((v) => v.id !== id),
    })),

  setActiveTool: (tool) => set({ activeTool: tool }),
  setColor: (color) => set({ selectedColor: color }),
  setMode: (mode) => set({ mode }),
  setEditingHighlightId: (id) => set({ editingHighlightId: id }),
  clearAll: () => set({ highlights: [], vocabList: [], editingHighlightId: null }),
}));
