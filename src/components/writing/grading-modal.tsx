'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import type { GradingResult } from '@/types/writing.types';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GradingResult | null;
  isLoading?: boolean;
}

const CRITERIA = [
  { key: 'taskAchievement' as const, label: 'Task Achievement', short: 'TR' },
  { key: 'coherenceCohesion' as const, label: 'Coherence & Cohesion', short: 'CC' },
  { key: 'lexicalResource' as const, label: 'Lexical Resource', short: 'LR' },
  { key: 'grammaticalRange' as const, label: 'Grammatical Range', short: 'GRA' },
];

const LOADING_STEPS = [
  'Đang đọc bài viết của bạn...',
  'Phân tích cấu trúc bài...',
  'Đánh giá Task Achievement...',
  'Đánh giá Coherence & Cohesion...',
  'Đánh giá Lexical Resource...',
  'Đánh giá Grammar...',
  'Tổng hợp kết quả...',
];

const MILESTONES = [12, 25, 40, 52, 64, 75, 82];

function GradingProgress() {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const milestoneRef = useRef(0);
  const targetRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const milestoneTimer = setInterval(() => {
      if (milestoneRef.current < MILESTONES.length) {
        targetRef.current = MILESTONES[milestoneRef.current];
        milestoneRef.current += 1;
      }
    }, 3000);

    targetRef.current = MILESTONES[0];
    milestoneRef.current = 1;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const target = targetRef.current;
        if (prev >= target) return prev;
        const diff = target - prev;
        const step = Math.max(0.3, diff * 0.06);
        return Math.min(target, prev + step);
      });
    }, 50);

    return () => {
      clearInterval(milestoneTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const idx = Math.min(
      Math.floor((progress / 82) * LOADING_STEPS.length),
      LOADING_STEPS.length - 1
    );
    setStepIndex(idx);
  }, [progress]);

  return (
    <div className="py-8 space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-18 h-18 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center shadow-md">
          <Sparkles className="h-8 w-8 text-teal-500 animate-pulse" />
        </div>
      </div>

      {/* Step text */}
      <p className="text-center text-sm font-medium text-gray-500">
        {LOADING_STEPS[stepIndex]}
      </p>

      {/* Progress bar */}
      <div className="px-4 space-y-2">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 tabular-nums">
          <span>Đang xử lý...</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}

function bandColor(band: number): string {
  if (band >= 8) return 'text-emerald-600';
  if (band >= 6.5) return 'text-teal-600';
  if (band >= 5) return 'text-amber-600';
  return 'text-red-500';
}

function bandBg(band: number): string {
  if (band >= 8) return 'bg-emerald-50 border-emerald-200/60';
  if (band >= 6.5) return 'bg-teal-50 border-teal-200/60';
  if (band >= 5) return 'bg-amber-50 border-amber-200/60';
  return 'bg-red-50 border-red-200/60';
}

export function GradingModal({ isOpen, onClose, result, isLoading }: GradingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-3xl border-teal-100/60">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            {isLoading ? 'Đang chấm bài...' : 'Kết quả chấm bài'}
          </DialogTitle>
        </DialogHeader>

        {isLoading && <GradingProgress />}

        {!isLoading && result && (
          <div className="space-y-5">
            {/* Overall band */}
            <div className="flex flex-col items-center py-4">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-200/50">
                <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-teal-600">{result.overallBand.toFixed(1)}</span>
                  <span className="text-[10px] text-gray-400 font-medium">Overall</span>
                </div>
              </div>
            </div>

            {/* Criteria cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {CRITERIA.map(({ key, label, short }) => (
                <div key={key} className={`rounded-2xl border p-3 ${bandBg(result[key])}`}>
                  <p className="text-[11px] font-semibold text-gray-500 mb-0.5">{short}</p>
                  <p className={`text-xl font-black ${bandColor(result[key])}`}>
                    {result[key].toFixed(1)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Feedback */}
            {result.feedback && (
              <div className="rounded-2xl bg-teal-50/50 border border-teal-100/60 p-4">
                <p className="text-xs font-bold text-teal-600 mb-2">Nhận xét</p>
                <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">
                  {result.feedback}
                </p>
              </div>
            )}

            <Button
              onClick={onClose}
              className="w-full rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-teal-200/50 h-10 transition-all hover:scale-[1.02]"
            >
              Đóng
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
