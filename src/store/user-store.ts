import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TargetScores, Activity, SkillKey } from '@/types';
import type { PlacementResult } from '@/types/placement.types';

interface UserState {
  targetScores: TargetScores;
  examDate: string | null;
  activities: Activity[];
  placementResult: PlacementResult | null;
  setTargetScore: (skill: SkillKey, score: number) => void;
  setExamDate: (date: string | null) => void;
  addActivity: (activity: Activity) => void;
  setPlacementResult: (result: PlacementResult | null) => void;
  clearPlacementResult: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      targetScores: {
        listening: 0,
        reading: 0,
        writing: 0,
        speaking: 0,
      },
      examDate: null,
      activities: [],
      placementResult: null,
      setTargetScore: (skill, score) =>
        set((state) => ({
          targetScores: {
            ...state.targetScores,
            [skill]: score,
          },
        })),
      setExamDate: (date) => set({ examDate: date }),
      addActivity: (activity) =>
        set((state) => ({
          activities: [...state.activities, activity],
        })),
      setPlacementResult: (result) => set({ placementResult: result }),
      clearPlacementResult: () => set({ placementResult: null }),
    }),
    {
      name: 'moni-user-storage',
      skipHydration: true,
    }
  )
);
