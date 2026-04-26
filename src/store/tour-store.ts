import { create } from 'zustand';

interface TourState {
  // 0 = inactive
  // 1 = goals, 2 = exam date, 3 = placement test trigger
  // 4 = intro "Done with placement", 5 = roadmap weekly explanation, 6 = assessment saturday, 7 = monthly assessment
  // 10 = new week intro overlay, 11 = focus on learn_metric + AI summary, 12 = focus on new weekly plan
  step: number;
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
