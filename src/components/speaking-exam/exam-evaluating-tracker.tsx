'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onComplete?: () => void;
}

export function ExamEvaluatingTracker({ onComplete }: Props) {
  const steps = [
    'Xử lý bản ghi tiếng nói (STT)...',
    'Bóc băng và làm sạch Transcript...',
    'Đánh giá Fluency & Coherence...',
    'Đo lường Lexical Resource...',
    'Phân tích Grammatical Range...',
    'Kiểm tra Pronunciation...',
    'Kích hoạt IELTS Rule Engine...',
    'Tổng hợp nhận xét bằng Tiếng Việt...'
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        
        // When we reach the last step, clear interval and trigger completion
        clearInterval(interval);
        if (onComplete) {
          // Give a small delay for the last step to be "seen" as completed
          setTimeout(onComplete, 1000);
        }
        return prev;
      });
    }, 2500); // 2.5s per step * 8 steps = 20s total

    return () => clearInterval(interval);
  }, [steps.length, onComplete]);

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[24px] shadow-sm border border-gray-100">
      <div className="flex flex-col items-center mb-10">
        <div className="relative mb-5 flex items-center justify-center">
          <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full bg-emerald-400 opacity-20"></span>
          <div className="relative bg-emerald-50 p-4 rounded-full border border-emerald-100 shadow-sm">
            <Bot className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 tracking-tight">Đang chấm bài nói</h3>
        <p className="text-[11px] text-gray-400 mt-2 uppercase tracking-widest font-bold">
          {steps.length} bước phân tích • Khoảng 25-35 giây
        </p>
      </div>

      <div className="space-y-5 relative">
        {/* Background line */}
        <div className="absolute left-[11px] top-2 bottom-3 w-px bg-gray-100" />
        
        {/* Active progress line */}
        <div 
           className="absolute left-[11px] top-2 w-px bg-emerald-500 transition-all duration-1000 ease-out"
           style={{ height: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div key={idx} className="flex items-center gap-4 relative z-10">
              <div className="flex-shrink-0 w-6 flex justify-center bg-white py-1">
                {isCompleted ? (
                   <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 fill-emerald-50" />
                ) : isActive ? (
                   <div className="relative flex h-[18px] w-[18px] items-center justify-center">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                     <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                   </div>
                ) : (
                   <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                )}
              </div>
              <span className={cn(
                "text-[14px] font-medium transition-all duration-300",
                isCompleted ? "text-gray-400" : isActive ? "text-gray-900 translate-x-1" : "text-gray-300"
              )}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
