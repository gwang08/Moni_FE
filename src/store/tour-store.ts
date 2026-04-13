import { create } from 'zustand';

interface TourState {
  step: number; // 0 = inactive, 1 = goals, 2 = exam date, 3 = placement test
  setStep: (step: number) => void;
  nextStep: () => void;
  stopTour: () => void;
}

export const useTourStore = create<TourState>((set) => ({
  step: 0,
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  stopTour: () => set({ step: 0 }),
}));
