'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

interface Question {
  id: number;
  content: string;
  position: number;
  sampleAnswer?: string;
}

interface SpeakingQuestionCenterProps {
  question: Question;
  showSample: boolean;
  onToggleSample: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export function SpeakingQuestionCenter({
  question,
  showSample,
  onToggleSample,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: SpeakingQuestionCenterProps) {
  return (
    <div className="space-y-4">
      {/* Question card */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-3">
          Câu {question.position}
        </p>
        <p className="text-lg font-medium text-gray-800 leading-relaxed">
          {question.content}
        </p>

        {/* Sample answer toggle */}
        {question.sampleAnswer && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSample}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-2 px-0"
            >
              <Lightbulb className="h-4 w-4" />
              {showSample ? 'Ẩn gợi ý' : 'Hiện gợi ý'}
            </Button>

            {showSample && (
              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-700 mb-1">Bài mẫu</p>
                <p className="text-sm text-green-800 leading-relaxed">
                  {question.sampleAnswer}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={!canPrev}
          className="gap-1 text-gray-600"
        >
          <ChevronLeft className="h-4 w-4" />
          Câu trước
        </Button>
        <Button
          variant="outline"
          onClick={onNext}
          disabled={!canNext}
          className="gap-1 text-gray-600"
        >
          Câu tiếp
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
