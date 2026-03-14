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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ChibiMascot() {
  return (
    <div className="relative w-24 h-24 mx-auto mb-2">
      <div className="animate-bounce-slow">
        <svg viewBox="0 0 120 120" className="w-24 h-24">
          <circle cx="60" cy="65" r="35" fill="#FFA94D" />
          <circle cx="60" cy="58" r="30" fill="#FFE0B2" />
          <ellipse cx="48" cy="53" rx="4" ry="5" fill="#333" />
          <circle cx="47" cy="51" r="1.5" fill="white" />
          <ellipse cx="72" cy="53" rx="4" ry="5" fill="#333" />
          <circle cx="71" cy="51" r="1.5" fill="white" />
          <path d="M48 64 Q60 75 72 64" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="40" cy="62" r="5" fill="#FFB3B3" opacity="0.6" />
          <circle cx="80" cy="62" r="5" fill="#FFB3B3" opacity="0.6" />
          <polygon points="60,20 30,35 60,42 90,35" fill="#333" />
          <rect x="55" y="18" width="10" height="5" rx="2" fill="#333" />
          <line x1="85" y1="35" x2="92" y2="45" stroke="#333" strokeWidth="2" />
          <circle cx="93" cy="47" r="3" fill="#FFA94D" />
          <rect x="82" y="70" width="18" height="14" rx="2" fill="#4FC3F7" transform="rotate(-15 91 77)" />
          <line x1="88" y1="68" x2="88" y2="82" stroke="white" strokeWidth="1" transform="rotate(-15 91 77)" />
          <circle cx="28" cy="72" r="6" fill="#FFE0B2" className="animate-wave-hand" />
        </svg>
      </div>
      <div className="absolute top-0 left-2 animate-sparkle">
        <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,0 7.5,4.5 12,6 7.5,7.5 6,12 4.5,7.5 0,6 4.5,4.5" fill="#FFD700" /></svg>
      </div>
      <div className="absolute top-4 right-0 animate-sparkle-delay">
        <svg width="10" height="10" viewBox="0 0 12 12"><polygon points="6,0 7.5,4.5 12,6 7.5,7.5 6,12 4.5,7.5 0,6 4.5,4.5" fill="#FF8A65" /></svg>
      </div>
    </div>
  );
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
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes wave-hand {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          25% { transform: rotate(-15deg) translateX(-3px); }
          75% { transform: rotate(15deg) translateX(3px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.5); }
        }
        @keyframes sparkle-delay {
          0%, 100% { opacity: 0.3; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-wave-hand { animation: wave-hand 1.5s ease-in-out infinite; transform-origin: 28px 72px; }
        .animate-sparkle { animation: sparkle 2s ease-in-out infinite; }
        .animate-sparkle-delay { animation: sparkle-delay 2s ease-in-out infinite; }
      `}</style>

      <PlacementGenerateLoading open={generating} />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-0 rounded-3xl shadow-2xl">
          <VisuallyHidden><DialogTitle>Kiểm tra trình độ IELTS</DialogTitle></VisuallyHidden>
          <div className="bg-gradient-to-b from-orange-100 via-orange-50 to-white pt-8 pb-2 px-6">
            <ChibiMascot />

            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-gray-800">
                Chào bạn! Cùng kiểm tra trình độ nhé 🎓
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Làm bài test nhanh để Moni đánh giá trình độ và tạo lộ trình học phù hợp cho bạn nha!
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
              Để sau nha ~
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
