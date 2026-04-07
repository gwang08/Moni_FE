'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Clock, BookOpen, HelpCircle, GraduationCap, Play, Loader2, Ban } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import { getActiveSession, type ExamSession } from '@/lib/exam-api';
import type { Exercise } from '@/types/practice.types';

interface Props {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const rm = minutes % 60;
    return rm > 0 ? `${h}h${rm}p` : `${h} giờ`;
  }
  return `${minutes} phút`;
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

  const exerciseId = exercise?.id;
  useEffect(() => {
    if (!open || !exerciseId) return;
    let cancelled = false;
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

  const go = (mode: 'practice' | 'exam') => {
    router.push(`/practice/${exercise.skill}/${exercise.id}?mode=${mode}`);
    onOpenChange(false);
  };

  const durationText = exercise.duration ? formatDuration(exercise.duration) : null;

  return (
    <>
      <ChibiAnimationStyles />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xs p-0 overflow-hidden border-0 rounded-3xl shadow-2xl" showCloseButton={false}>
          <VisuallyHidden><DialogTitle>{exercise.title}</DialogTitle></VisuallyHidden>

          {/* Header with chibi */}
          <div className="bg-gradient-to-b from-orange-50 via-amber-50/50 to-white pt-5 pb-1 px-5">
            <ChibiMascot mood={activeSession ? 'excited' : 'thinking'} size={64} />
            <div className="text-center">
              <h2 className="text-base font-bold text-gray-800 line-clamp-1">{exercise.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Chọn chế độ luyện tập</p>
            </div>
          </div>

          <div className="px-4 pb-4 pt-1 space-y-2.5">
            {/* Resume banner */}
            {checking && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang kiểm tra phiên thi...
              </div>
            )}

            {activeSession && !checking && (
              <button
                onClick={() => go('exam')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-200/50 transition-all hover:scale-[1.01] hover:shadow-lg"
              >
                <div className="p-1.5 rounded-full bg-white/20">
                  <Play className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold">Tiếp tục làm bài</p>
                  <p className="text-[11px] opacity-80 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    Còn {formatRemaining(activeSession.remainingSeconds)}
                  </p>
                </div>
                <span className="text-white/70">→</span>
              </button>
            )}

            {/* Mode cards */}
            <div className="grid grid-cols-2 gap-2">
              {/* Practice */}
              <button
                onClick={() => go('practice')}
                className="flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 border-transparent bg-blue-50 hover:border-blue-300 transition-all group"
              >
                <div className="p-2 rounded-xl bg-blue-500 text-white group-hover:scale-110 transition-transform shadow-sm">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-blue-700">Luyện tập</span>
                <div className="text-[10px] text-blue-400 space-y-0.5">
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
                onClick={() => go('exam')}
                className="flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 border-transparent bg-orange-50 hover:border-orange-300 transition-all group"
              >
                <div className="p-2 rounded-xl bg-orange-500 text-white group-hover:scale-110 transition-transform shadow-sm">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-orange-700">Thi thử</span>
                <div className="text-[10px] text-orange-400 space-y-0.5">
                  {exercise.skill !== 'listening' && exercise.skill !== 'speaking' && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {durationText ?? 'Có giới hạn'}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Ban className="h-2.5 w-2.5" />
                    Không gợi ý
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel */}
            <button
              onClick={() => onOpenChange(false)}
              className="w-full text-xs text-gray-400 hover:text-gray-500 py-1 transition-colors"
            >
              Để sau nhé ~
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
