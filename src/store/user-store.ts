import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TargetScores, Activity, SkillKey } from '@/types';

interface UserState {
  targetScores: TargetScores;
  examDate: string | null;
  activities: Activity[];
  setTargetScore: (skill: SkillKey, score: number) => void;
  setExamDate: (date: string | null) => void;
  addActivity: (activity: Activity) => void;
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
    }),
    {
      name: 'moni-user-storage',
      skipHydration: true,
    }
  )
);
