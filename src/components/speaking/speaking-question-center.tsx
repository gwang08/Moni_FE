'use client';

import { ChevronLeft, ChevronRight, Lightbulb, BookOpen } from 'lucide-react';

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
      <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-orange-100/60 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 text-white text-[11px] font-bold shadow-sm shadow-orange-300/30">
            {'Câu'} {question.position}
          </span>
        </div>
        <p className="text-lg font-medium text-gray-800 leading-relaxed">
          {question.content}
        </p>

        {/* Sample answer toggle */}
        {question.sampleAnswer && (
          <div className="mt-5 pt-4 border-t border-orange-100/40">
            <button
              onClick={onToggleSample}
              className="flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              </div>
              {showSample ? 'Ẩn gợi ý' : 'Hiện gợi ý'}
            </button>

            {showSample && (
              <div className="mt-3 rounded-2xl bg-gradient-to-br from-green-50/80 to-emerald-50/60 border border-green-200/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-3.5 w-3.5 text-green-600" />
                  <p className="text-xs font-bold text-green-700">{'Bài mẫu'}</p>
                </div>
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
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-orange-100/60 text-sm font-medium text-gray-600 hover:text-orange-600 hover:border-orange-200/60 hover:shadow-md hover:shadow-orange-100/20 transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          <ChevronLeft className="h-4 w-4" />
          {'Câu trước'}
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-orange-100/60 text-sm font-medium text-gray-600 hover:text-orange-600 hover:border-orange-200/60 hover:shadow-md hover:shadow-orange-100/20 transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          {'Câu tiếp'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
