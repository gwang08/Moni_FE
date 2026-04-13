'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { generatePlacement } from '@/lib/placement-api';
import { PlacementGenerateLoading } from '@/components/placement/placement-generate-loading';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import { useTourStore } from '@/store/tour-store';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlacementDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const setStep = useTourStore((s) => s.setStep);
  const [generating, setGenerating] = useState(false);

  const handleStartTour = () => {
    onOpenChange(false);
    setStep(1);
    // Cuộn lên đầu trang để trải nghiệm mượt hơn
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

            <button
              onClick={() => onOpenChange(false)}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
            >
              Để sau nhé ~
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
