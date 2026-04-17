'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { PlacementGenerateLoading } from '@/components/placement/placement-generate-loading';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import { useTourStore } from '@/store/tour-store';

export const PLACEMENT_SKIP_KEY = 'placement-dialog-skipped-this-session';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlacementDialog({ open, onOpenChange }: Props) {
  const setStep = useTourStore((s) => s.setStep);
  const [generating] = useState(false);
  const [skipForSession, setSkipForSession] = useState(false);

  const handleStartTour = () => {
    onOpenChange(false);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLater = () => {
    if (skipForSession && typeof window !== 'undefined') {
      sessionStorage.setItem(PLACEMENT_SKIP_KEY, '1');
    }
    onOpenChange(false);
  };

  return (
    <>
      <ChibiAnimationStyles />
      <PlacementGenerateLoading open={generating} />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-0 rounded-3xl shadow-2xl">
          <VisuallyHidden><DialogTitle>Kiểm tra trình độ IELTS</DialogTitle></VisuallyHidden>
          <div className="bg-gradient-to-b from-orange-100 via-orange-50 to-white pt-8 pb-2 px-6">
            <ChibiMascot mood="excited" size={96} />

            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-gray-800">
                Lên lộ trình học tập 🎓
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Hoàn thành vài bước thiết lập cơ bản để Moni phác thảo lộ trình học cá nhân hoá dành riêng cho bạn nhé!
              </p>
            </div>
          </div>

          <div className="px-6 pb-6 pt-3 space-y-2.5">
            <Button
              onClick={handleStartTour}
              className="w-full bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white rounded-2xl h-12 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Bắt đầu thiết lập
            </Button>

            <label className="flex items-center justify-center gap-2 text-[12px] text-gray-500 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={skipForSession}
                onChange={(e) => setSkipForSession(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-300 cursor-pointer"
              />
              Không hỏi lại trong phiên này
            </label>

            <button
              onClick={handleLater}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1.5 transition-colors"
            >
              Để sau nhé ~
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
