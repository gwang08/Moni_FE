'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, HelpCircle, GraduationCap, Play, Loader2 } from 'lucide-react';
import { getActiveSession, type ExamSession } from '@/lib/exam-api';
import type { Exercise } from '@/types/practice.types';

interface Props {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? `${h}h${rm}p` : `${h} giờ`;
  }
  return `${m} phút`;
}

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ModeSelectionModal({ exercise, open, onOpenChange }: Props) {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [checking, setChecking] = useState(false);

  // Check for active exam session when modal opens
  const exerciseId = exercise?.id;
  useEffect(() => {
    if (!open || !exerciseId) return;
    let cancelled = false;
    // Use callback form to batch with render
    const check = async () => {
      try {
        const session = await getActiveSession(Number(exerciseId));
        if (cancelled) return;
        setActiveSession(session?.status === 'IN_PROGRESS' ? session : null);
      } catch {
        if (!cancelled) setActiveSession(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    setChecking(true);
    check();
    return () => { cancelled = true; };
  }, [open, exerciseId]);

  if (!exercise) return null;

  const handleSelectMode = (mode: 'practice' | 'exam') => {
    router.push(`/practice/${exercise.skill}/${exercise.id}?mode=${mode}`);
    onOpenChange(false);
  };

  const handleResume = () => {
    router.push(`/practice/${exercise.skill}/${exercise.id}?mode=exam`);
    onOpenChange(false);
  };

  const durationText = exercise.duration ? formatDuration(exercise.duration) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 rounded-2xl overflow-hidden border-0 shadow-xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="font-bold text-base text-gray-800 line-clamp-1">{exercise.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{exercise.description}</p>
        </div>

        {/* Resume banner */}
        {checking && (
          <div className="mx-5 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 text-xs text-gray-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang kiểm tra...
          </div>
        )}

        {activeSession && !checking && (
          <button
            onClick={handleResume}
            className="mx-5 mb-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 hover:border-orange-400 transition-all group"
          >
            <div className="p-2 rounded-full bg-orange-500 text-white group-hover:scale-110 transition-transform">
              <Play className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-orange-700">Tiếp tục làm bài</p>
              <p className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                Còn {formatRemaining(activeSession.remainingSeconds)}
              </p>
            </div>
            <span className="text-orange-400 text-lg">→</span>
          </button>
        )}

        {/* Mode buttons */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-2">
          {/* Practice */}
          <button
            onClick={() => handleSelectMode('practice')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="p-2.5 rounded-full bg-blue-500 text-white group-hover:scale-110 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-blue-700">Luyện tập</span>
            <div className="text-[11px] text-blue-500 space-y-0.5">
              <div className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                Không giới hạn
              </div>
              <div className="flex items-center gap-1">
                <HelpCircle className="h-2.5 w-2.5" />
                Có gợi ý
              </div>
            </div>
          </button>

          {/* Exam */}
          <button
            onClick={() => handleSelectMode('exam')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-orange-100 bg-orange-50/50 hover:border-orange-300 hover:bg-orange-50 transition-all group"
          >
            <div className="p-2.5 rounded-full bg-orange-500 text-white group-hover:scale-110 transition-transform">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-orange-700">Thi thử</span>
            <div className="text-[11px] text-orange-500 space-y-0.5">
              <div className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {durationText ?? 'Có giới hạn'}
              </div>
              <div className="flex items-center gap-1">
                <GraduationCap className="h-2.5 w-2.5" />
                Không gợi ý
              </div>
            </div>
          </button>
        </div>

        {/* Cancel */}
        <div className="px-5 pb-4 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-gray-400 hover:text-gray-600 text-xs"
          >
            Hủy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
