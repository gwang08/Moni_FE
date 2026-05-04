import { create } from 'zustand';

export type TourType = 'none' | 'feature' | 'setup' | 'new-week';

interface TourState {
  tourType: TourType;
  // Step meaning depends on tourType:
  //
  // tourType 'feature' (Feature Highlight Tour — pre-purchase):
  //   1-5 = feature intro slides, slide 5 = CTA buy
  //
  // tourType 'setup' (Setup Tour — post-purchase):
  //   1 = goals, 2 = exam date, 3 = placement test trigger
  //   4 = intro "Done with placement", 5 = roadmap weekly, 6 = assessment saturday, 7 = monthly assessment
  //   8 = focus on RoadmapPaywall (legacy, kept for compat)
  //
  // tourType 'new-week':
  //   10 = new week intro overlay, 11 = focus on learn_metric + AI summary, 12 = focus on new weekly plan
  step: number;
  setTour: (type: TourType, step: number) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  stopTour: () => void;
}

export const useTourStore = create<TourState>((set) => ({
  tourType: 'none',
  step: 0,
  setTour: (tourType, step) => set({ tourType, step }),
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  stopTour: () => set({ tourType: 'none', step: 0 }),
}));
