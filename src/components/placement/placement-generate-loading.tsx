'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

const STEPS = [
  { label: 'Đang chuẩn bị bài test...', duration: 800, check: 'Khởi tạo hệ thống' },
  { label: 'Chọn đề Reading cho bạn...', duration: 1000, check: 'Chọn đề Reading từ ngân hàng đề' },
  { label: 'Chọn đề Listening cho bạn...', duration: 1000, check: 'Chọn đề Listening từ ngân hàng đề' },
  { label: 'Sắp xong rồi!', duration: 600, check: 'Hoàn tất chuẩn bị' },
];

interface Props {
  open: boolean;
}

function ChibiLoading() {
  return (
    <div className="relative w-20 h-20 mx-auto mb-4">
      <div className="animate-bounce-slow">
        <svg viewBox="0 0 120 120" className="w-20 h-20">
          <circle cx="60" cy="65" r="35" fill="#FFA94D" />
          <circle cx="60" cy="58" r="30" fill="#FFE0B2" />
          {/* Eyes - focused/excited */}
          <ellipse cx="48" cy="53" rx="3.5" ry="2" fill="#333" />
          <ellipse cx="72" cy="53" rx="3.5" ry="2" fill="#333" />
          {/* Excited mouth */}
          <ellipse cx="60" cy="66" rx="6" ry="5" fill="#333" />
          <ellipse cx="60" cy="64" rx="5" ry="3" fill="#FFE0B2" />
          {/* Blush */}
          <circle cx="40" cy="62" r="5" fill="#FFB3B3" opacity="0.6" />
          <circle cx="80" cy="62" r="5" fill="#FFB3B3" opacity="0.6" />
          {/* Graduation cap */}
          <polygon points="60,20 30,35 60,42 90,35" fill="#333" />
          <rect x="55" y="18" width="10" height="5" rx="2" fill="#333" />
          <line x1="85" y1="35" x2="92" y2="45" stroke="#333" strokeWidth="2" />
          <circle cx="93" cy="47" r="3" fill="#FFA94D" />
        </svg>
      </div>
    </div>
  );
}

export function PlacementGenerateLoading({ open }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      return;
    }

    let stepIndex = 0;
    const advance = () => {
      if (stepIndex < STEPS.length - 1) {
        stepIndex++;
        setCurrentStep(stepIndex);
        setTimeout(advance, STEPS[stepIndex].duration);
      }
    };
    const timer = setTimeout(advance, STEPS[0].duration);
    return () => clearTimeout(timer);
  }, [open]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-xs p-0 overflow-hidden border-0 rounded-3xl shadow-2xl"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden><DialogTitle>Đang tạo bài test</DialogTitle></VisuallyHidden>
        <div className="bg-gradient-to-b from-orange-100 via-orange-50 to-white pt-8 pb-6 px-6">
          <ChibiLoading />

          <div className="text-center mb-4">
            <p className="text-sm font-semibold text-gray-700">
              {STEPS[currentStep].label}
            </p>
            <p className="text-xs text-orange-500 font-bold mt-1">{Math.round(progress)}%</p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-orange-100 rounded-full h-2 overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-rose-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={i} className={`flex items-center gap-2 text-xs transition-opacity duration-300 ${
                  done ? 'text-green-600' : active ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  {done ? (
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : active ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400 shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-gray-200 shrink-0" />
                  )}
                  <span className={done ? 'line-through' : active ? 'font-medium' : ''}>{step.check}</span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
