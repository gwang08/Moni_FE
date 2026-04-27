'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, BookOpen, Headphones, PenLine, Mic } from 'lucide-react';

const STEPS = [
  { label: 'Chấm bài Reading', icon: BookOpen, delay: 2000, color: 'blue' },
  { label: 'Chấm bài Listening', icon: Headphones, delay: 2000, color: 'purple' },
  { label: 'AI đang chấm bài Writing', icon: PenLine, delay: 15000, color: 'emerald' },
  { label: 'AI đang đánh giá bài Speaking', icon: Mic, delay: 15000, color: 'rose' },
] as const;

const COLORS = {
  blue:    { done: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: 'text-blue-500', check: 'text-blue-500' },
  purple:  { done: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: 'text-purple-500', check: 'text-purple-500' },
  emerald: { done: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500', check: 'text-emerald-500' },
  rose:    { done: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: 'text-rose-500', check: 'text-rose-500' },
};

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

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const progress = ((currentStep) / STEPS.length) * 100;

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-orange-50/30 via-white to-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">

        {/* Mascot / Animated illustration */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Outer pulse rings */}
            <div className="absolute inset-[-12px] rounded-full border-2 border-orange-200/50 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-[-6px] rounded-full border border-orange-100 animate-pulse" />
            {/* Main circle */}
            <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 shadow-xl shadow-orange-200/50 flex items-center justify-center">
              <svg viewBox="0 0 80 80" className="w-16 h-16">
                {/* Moni face */}
                <circle cx="40" cy="42" r="28" fill="#FFE0B2" />
                {/* Eyes - looking around */}
                <ellipse cx="32" cy="38" rx="3" ry="2.5" fill="#333">
                  <animate attributeName="cx" values="32;34;32;30;32" dur="3s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="48" cy="38" rx="3" ry="2.5" fill="#333">
                  <animate attributeName="cx" values="48;50;48;46;48" dur="3s" repeatCount="indefinite" />
                </ellipse>
                {/* Happy mouth */}
                <path d="M34 49 Q40 55 46 49" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" />
                {/* Blush */}
                <circle cx="26" cy="46" r="4" fill="#FFB3B3" opacity="0.5" />
                <circle cx="54" cy="46" r="4" fill="#FFB3B3" opacity="0.5" />
                {/* Graduation cap */}
                <polygon points="40,10 18,22 40,28 62,22" fill="#333" />
                <rect x="36" y="8" width="8" height="4" rx="2" fill="#333" />
                <line x1="58" y1="22" x2="64" y2="30" stroke="#333" strokeWidth="1.5" />
                <circle cx="65" cy="32" r="2.5" fill="#FFA94D" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Moni đang chấm điểm{dots}
          </h2>
          <p className="text-sm text-gray-500">
            AI đang phân tích bài làm của bạn. Quá trình này mất khoảng 30-60 giây.
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center font-medium">{Math.round(progress)}% hoàn thành</p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            const isPending = idx > currentStep;
            const Icon = step.icon;
            const colorSet = COLORS[step.color];

            return (
              <div
                key={idx}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-500 ${
                  isDone
                    ? `${colorSet.done}`
                    : isActive
                    ? 'bg-white border-orange-200 shadow-md shadow-orange-100/50'
                    : 'bg-gray-50/50 border-gray-100 opacity-40'
                }`}
              >
                {/* Icon */}
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDone
                    ? `bg-white/70`
                    : isActive
                    ? 'bg-orange-100'
                    : 'bg-gray-100'
                }`}>
                  {isDone ? (
                    <CheckCircle2 className={`h-5 w-5 ${colorSet.check}`} />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5 text-gray-300" />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold ${
                    isDone ? colorSet.text : isActive ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                  {isActive && (
                    <p className="text-xs text-orange-500 mt-0.5 font-medium">Đang xử lý...</p>
                  )}
                  {isDone && (
                    <p className={`text-xs ${colorSet.text} mt-0.5 opacity-70`}>Hoàn thành</p>
                  )}
                </div>

                {/* Status dot */}
                {isDone && (
                  <div className={`shrink-0 w-2 h-2 rounded-full ${colorSet.icon.replace('text-', 'bg-')}`} />
                )}
                {isActive && (
                  <div className="shrink-0 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Tip */}
        <div className="text-center">
          <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2.5 inline-block">
            Vui lòng không tắt trang trong quá trình chấm điểm
          </p>
        </div>
      </div>
    </div>
  );
}
