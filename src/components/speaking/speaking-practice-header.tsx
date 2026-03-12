'use client';

import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SpeakingPracticeHeaderProps {
  title: string;
  currentPart: number;
  currentQuestion: number;
  totalQuestions: number;
  onExit: () => void;
}

export function SpeakingPracticeHeader({
  title,
  currentPart,
  currentQuestion,
  totalQuestions,
  onExit,
}: SpeakingPracticeHeaderProps) {
  return (
    <div className="h-14 bg-white border-b flex items-center px-4 shrink-0">
      {/* Left: back arrow + title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button variant="ghost" size="icon" onClick={onExit} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-gray-800 truncate">{title}</span>
      </div>

      {/* Center: part badge + question counter */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">
          Part {currentPart}
        </Badge>
        <span className="text-sm font-medium text-gray-600">
          Câu {currentQuestion}/{totalQuestions}
        </span>
      </div>

      {/* Right: exit button */}
      <div className="flex-1 flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="text-gray-500 hover:text-red-500"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
