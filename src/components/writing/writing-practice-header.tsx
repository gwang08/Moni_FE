'use client';

import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WritingTaskType } from '@/types/writing.types';

interface WritingPracticeHeaderProps {
  title: string;
  taskType: WritingTaskType;
  wordCount: number;
  minWords: number;
  elapsedTime: string;
  isGrading: boolean;
  canGrade: boolean;
  onGrade: () => void;
  onExit: () => void;
}

function wordCountColor(wordCount: number, minWords: number): string {
  const ratio = wordCount / minWords;
  if (ratio >= 1) return 'text-emerald-600 font-semibold';
  if (ratio >= 0.5) return 'text-yellow-600 font-semibold';
  return 'text-red-500 font-semibold';
}

export function WritingPracticeHeader({
  title,
  taskType,
  wordCount,
  minWords,
  elapsedTime,
  isGrading,
  canGrade,
  onGrade,
  onExit,
}: WritingPracticeHeaderProps) {
  return (
    <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
      {/* Left: back + title + badge + timer */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onExit}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">
              Task {taskType}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">{elapsedTime}</span>
          </div>
        </div>
      </div>

      {/* Center: word count */}
      <div className="text-center">
        <span className={`text-sm ${wordCountColor(wordCount, minWords)}`}>
          {wordCount}
        </span>
        <span className="text-sm text-muted-foreground"> / {minWords} từ</span>
      </div>

      {/* Right: grade + exit buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onGrade}
          disabled={!canGrade || isGrading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isGrading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang chấm...
            </>
          ) : (
            'Chấm điểm'
          )}
        </Button>
        <Button variant="outline" onClick={onExit}>
          Thoát
        </Button>
      </div>
    </div>
  );
}
