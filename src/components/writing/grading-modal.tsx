'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { GradingResult } from '@/types/writing.types';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GradingResult | null;
  isLoading?: boolean;
}

const CRITERIA_LABELS = [
  { key: 'taskAchievement', label: 'Task Achievement (TR)' },
  { key: 'coherenceCohesion', label: 'Coherence & Cohesion (CC)' },
  { key: 'lexicalResource', label: 'Lexical Resource (LR)' },
  { key: 'grammaticalRange', label: 'Grammatical Range (GRA)' },
] as const;

const LOADING_STEPS = [
  'Phân tích cấu trúc bài viết...',
  'Đánh giá Task Achievement...',
  'Đánh giá Coherence & Cohesion...',
  'Đánh giá Lexical Resource...',
  'Đánh giá Grammar...',
  'Tổng hợp kết quả...',
];

function GradingProgress() {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Smooth progress: fast at start, slow towards end
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return prev; // cap at 88%, wait for real result
        // Slow down as we approach the cap
        const remaining = 88 - prev;
        const step = Math.max(0.3, remaining * 0.04);
        return Math.min(88, prev + step);
      });
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Update step label based on progress
  useEffect(() => {
    const idx = Math.min(
      Math.floor((progress / 88) * LOADING_STEPS.length),
      LOADING_STEPS.length - 1
    );
    setStepIndex(idx);
  }, [progress]);

  return (
    <div className="py-8 px-2 space-y-5">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{LOADING_STEPS[stepIndex]}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Animated dots */}
      <div className="flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <p className="text-center text-sm text-gray-500">
        AI đang phân tích bài viết của bạn, vui lòng chờ...
      </p>
    </div>
  );
}

export function GradingModal({ isOpen, onClose, result, isLoading }: GradingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? 'Đang chấm bài...' : 'Kết quả chấm bài'}
          </DialogTitle>
        </DialogHeader>

        {isLoading && <GradingProgress />}

        {!isLoading && result && (
          <div className="space-y-6">
            {/* Overall band score */}
            <div className="text-center p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
              <p className="text-sm uppercase tracking-widest mb-2 opacity-90">Overall Band Score</p>
              <p className="text-6xl font-bold">{result.overallBand.toFixed(1)}</p>
            </div>

            {/* Criteria scores grid */}
            <div className="grid grid-cols-2 gap-3">
              {CRITERIA_LABELS.map(({ key, label }) => (
                <div key={key} className="border border-emerald-100 rounded-lg p-4 bg-emerald-50/50">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {result[key].toFixed(1)}
                  </p>
                </div>
              ))}
            </div>

            {/* Feedback */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 text-gray-800">Nhận xét</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {result.feedback}
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Đóng
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
