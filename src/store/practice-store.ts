import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PracticeStore {
  completedExercises: string[];
  markCompleted: (exerciseId: string) => void;
  isCompleted: (exerciseId: string) => boolean;
  clearProgress: () => void;
}

export const usePracticeStore = create<PracticeStore>()(
  persist(
    (set, get) => ({
      completedExercises: [],

      markCompleted: (exerciseId) =>
        set((state) => ({
          completedExercises: state.completedExercises.includes(exerciseId)
            ? state.completedExercises
            : [...state.completedExercises, exerciseId],
        })),

      isCompleted: (exerciseId) => get().completedExercises.includes(exerciseId),

      clearProgress: () => set({ completedExercises: [] }),
    }),
    { name: 'practice-progress' }
  )
);
