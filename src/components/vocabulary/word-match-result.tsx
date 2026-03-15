'use client';

import { Button } from '@/components/ui/button';
import { RotateCcw, Timer } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';

interface WordMatchResultProps {
  elapsedSeconds: number;
  moves: number;
  totalPairs: number;
  onRetry: () => void;
}

export function WordMatchResult({ elapsedSeconds, moves, totalPairs, onRetry }: WordMatchResultProps) {
  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="text-center space-y-6 py-8">
      <ChibiAnimationStyles />
      <ChibiMascot mood="excited" size={80} />
      <h2 className="text-2xl font-bold text-gray-900">Hoàn thành!</h2>
      <p className="text-gray-500">Bạn đã ghép đúng tất cả {totalPairs} cặp từ.</p>

      <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
        <div className="rounded-xl border bg-purple-50 p-4">
          <Timer className="h-5 w-5 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-600">{formatTime(elapsedSeconds)}</p>
          <p className="text-xs text-gray-500 mt-1">Thời gian</p>
        </div>
        <div className="rounded-xl border bg-blue-50 p-4">
          <p className="text-2xl font-bold text-blue-600">{moves}</p>
          <p className="text-xs text-gray-500 mt-1">Lượt thực hiện</p>
        </div>
      </div>

      <Button onClick={onRetry} className="w-full max-w-xs mx-auto block bg-purple-600 hover:bg-purple-700">
        <RotateCcw className="h-4 w-4 mr-2" />
        Chơi lại
      </Button>
    </div>
  );
}
