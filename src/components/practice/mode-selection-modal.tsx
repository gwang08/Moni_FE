'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookMarked, Clock, BookOpen, HelpCircle } from 'lucide-react';
import type { Exercise } from '@/types/practice.types';

interface Props {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModeSelectionModal({ exercise, open, onOpenChange }: Props) {
  const router = useRouter();

  if (!exercise) return null;

  const handleSelectMode = (mode: 'practice' | 'exam') => {
    router.push(`/practice/${exercise.skill}/${exercise.id}?mode=${mode}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{exercise.title}</DialogTitle>
          <DialogDescription>{exercise.description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Practice Mode */}
          <button
            onClick={() => handleSelectMode('practice')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all group"
          >
            <div className="p-3 rounded-full bg-blue-500 text-white group-hover:scale-110 transition-transform">
              <BookMarked className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-blue-800">Luyện tập</h3>
              <p className="text-xs text-blue-600 mt-1">Học và thực hành</p>
            </div>
            <div className="text-xs text-blue-600 space-y-1 mt-2">
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>Tra từ vựng</span>
              </div>
              <div className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                <span>Xem gợi ý</span>
              </div>
            </div>
          </button>

          {/* Exam Mode */}
          <button
            onClick={() => handleSelectMode('exam')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 transition-all group"
          >
            <div className="p-3 rounded-full bg-orange-500 text-white group-hover:scale-110 transition-transform">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-orange-800">Thi thử</h3>
              <p className="text-xs text-orange-600 mt-1">Mô phỏng thi thật</p>
            </div>
            <div className="text-xs text-orange-600 space-y-1 mt-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Giới hạn thời gian</span>
              </div>
              <div className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                <span>Không gợi ý</span>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
