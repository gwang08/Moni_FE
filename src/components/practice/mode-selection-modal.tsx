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
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 rounded-3xl shadow-2xl" showCloseButton={false}>
          <VisuallyHidden><DialogTitle>{exercise.title}</DialogTitle></VisuallyHidden>

          {/* Header with chibi */}
          <div className="bg-gradient-to-b from-orange-50 via-amber-50/50 to-white pt-6 pb-2 px-6">
            <ChibiMascot mood={activeSession ? 'excited' : 'thinking'} size={64} />
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800 line-clamp-1">{exercise.title}</h2>
              <p className="text-xs text-gray-400 mt-1">Chọn chế độ luyện tập</p>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2 space-y-4">
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

            {/* Mode cards — match speaking modal visual style */}
            <div className="grid grid-cols-2 gap-4">
              {/* Practice */}
              <button
                onClick={() => go('practice')}
                className="group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-blue-100 bg-gradient-to-b from-blue-50/80 to-white hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200/50 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="font-bold text-sm text-gray-900">Luyện tập</p>
                  <div className="space-y-1 text-xs text-gray-500 leading-relaxed">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      Không giới hạn
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      Có gợi ý
                    </div>
                  </div>
                </div>
              </button>

              {/* Exam */}
              <button
                onClick={() => go('exam')}
                className="group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-orange-100 bg-gradient-to-b from-orange-50/80 to-white hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/50 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-200/50 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="font-bold text-sm text-gray-900">Thi thử</p>
                  <div className="space-y-1 text-xs text-gray-500 leading-relaxed">
                    {exercise.skill !== 'listening' && exercise.skill !== 'speaking' && (
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {durationText ?? 'Có giới hạn'}
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-1">
                      <Ban className="h-3 w-3" />
                      Không gợi ý
                    </div>
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
