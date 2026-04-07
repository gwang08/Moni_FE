'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import { Check } from 'lucide-react';

interface Props {
  open: boolean;
}

const STEPS = [
  { label: 'Đang phân tích cấu trúc bài viết...', delay: 15000 },
  { label: 'Đánh giá Task Achievement...', delay: 15000 },
  { label: 'Đánh giá Coherence & Cohesion...', delay: 35000 },
  { label: 'Đánh giá Lexical Resource...', delay: 55000 },
  { label: 'Đánh giá Grammatical Range...', delay: 75000 },
  { label: 'Áp dụng Rule Engine...', delay: 95000 },
  { label: 'Tổng hợp nhận xét & feedback...', delay: 110000 },
];

export function WritingScoringProgressDialog({ open }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!open) { setCurrentStep(0); return; }
    const timers = STEPS.map((step, i) => {
      if (i === 0) return null;
      return setTimeout(() => setCurrentStep(i), step.delay);
    }).filter(Boolean) as ReturnType<typeof setTimeout>[];
    return () => timers.forEach(clearTimeout);
  }, [open]);

  return (
    <>
      <ChibiAnimationStyles />
      <Dialog open={open}>
        <DialogContent className="max-w-xs p-0 overflow-hidden border-0 rounded-3xl shadow-2xl" showCloseButton={false}>
          <VisuallyHidden><DialogTitle>Đang chấm điểm</DialogTitle></VisuallyHidden>

          <div className="bg-gradient-to-b from-teal-50 via-emerald-50/50 to-white pt-5 pb-2 px-5">
            <ChibiMascot mood="thinking" size={64} />
            <p className="text-center text-sm font-bold text-gray-700 mt-1">Đang chấm bài viết</p>
            <p className="text-center text-[11px] text-gray-400 mt-0.5">7 bước phân tích • khoảng 60-120 giây</p>
          </div>

          <div className="px-5 pb-5 pt-2 space-y-2">
            {STEPS.map((step, i) => {
              const isDone = i < currentStep;
              const isActive = i === currentStep;
              return (
                <div key={i} className={`flex items-center gap-2.5 py-1.5 transition-opacity duration-300 ${i > currentStep ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isDone ? 'bg-green-500' : isActive ? 'bg-teal-500 animate-pulse' : 'bg-gray-200'
                  }`}>
                    {isDone ? (
                      <Check className="h-3 w-3 text-white" />
                    ) : isActive ? (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    )}
                  </div>
                  <span className={`text-xs ${
                    isDone ? 'text-green-600 font-medium' : isActive ? 'text-teal-600 font-semibold' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
