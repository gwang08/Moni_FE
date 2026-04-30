'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, BookOpen, Headphones, PenLine, Mic, Sparkles } from 'lucide-react';

const STEPS = [
  { label: 'Reading', icon: BookOpen, delay: 2000, gradient: 'from-blue-500 to-blue-600' },
  { label: 'Listening', icon: Headphones, delay: 2000, gradient: 'from-violet-500 to-purple-600' },
  { label: 'Writing', icon: PenLine, delay: 15000, gradient: 'from-emerald-500 to-teal-600' },
  { label: 'Speaking', icon: Mic, delay: 15000, gradient: 'from-orange-500 to-rose-500' },
] as const;

export function GradingStep() {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (currentStep >= STEPS.length) return;
    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }, STEPS[currentStep].delay);
    return () => clearTimeout(timer);
  }, [currentStep]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-4">
      <div className="w-full max-w-md space-y-5">

        {/* Mascot + Title inline */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="relative h-16 w-16 rounded-full bg-white shadow-lg shadow-teal-100/40 border border-gray-100 flex items-center justify-center">
              <span className="text-3xl animate-bounce" style={{ animationDuration: '2s' }}>🧑‍🏫</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">Moni đang chấm điểm{dots}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Quá trình này mất khoảng 30–60 giây</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 transition-all duration-1000 ease-out"
              style={{ width: `${Math.max(progress, 3)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>{currentStep}/{STEPS.length} hoàn thành</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            const Icon = step.icon;

            return (
              <div
                key={idx}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-500
                  ${isDone
                    ? 'bg-white border-gray-100'
                    : isActive
                    ? 'bg-white border-gray-200 shadow-md shadow-gray-100/60'
                    : 'bg-gray-50/60 border-gray-100/60 opacity-40'
                  }
                `}
              >
                <div className={`
                  shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500
                  ${isDone
                    ? `bg-gradient-to-br ${step.gradient}`
                    : isActive
                    ? 'bg-gray-100'
                    : 'bg-gray-100/60'
                  }
                `}>
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : isActive ? (
                    <Icon className="h-4 w-4 text-gray-500 animate-pulse" />
                  ) : (
                    <Icon className="h-4 w-4 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${
                    isDone ? 'text-gray-700' : isActive ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {isActive ? `Đang chấm ${step.label}` : `Chấm bài ${step.label}`}
                  </span>
                  {isDone && <span className="text-xs text-emerald-500 ml-2 font-medium">✓</span>}
                </div>

                {isActive && (
                  <div className="shrink-0 h-4 w-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-gray-400">
          Vui lòng không tắt trang trong quá trình chấm điểm
        </p>
      </div>
    </div>
  );
}
