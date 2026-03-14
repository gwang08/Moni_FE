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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlacementDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  const handleStartTest = async () => {
    onOpenChange(false);
    setGenerating(true);
    try {
      const pair = await generatePlacement();
      sessionStorage.setItem('pending-placement-test', JSON.stringify(pair));
      router.push('/placement');
    } catch {
      toast.error('Không thể tạo bài test. Vui lòng thử lại.');
      setGenerating(false);
    }
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
                Chào bạn! Cùng kiểm tra trình độ nhé 🎓
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Làm bài test nhanh để Moni đánh giá trình độ và tạo lộ trình học phù hợp cho bạn nhé!
              </p>
            </div>
          </div>

          <div className="px-6 pb-6 pt-3 space-y-2.5">
            <Button
              onClick={handleStartTest}
              className="w-full bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white rounded-2xl h-12 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Làm bài test Reading + Listening
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
