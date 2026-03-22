'use client';

import { ChevronLeft, ChevronRight, Lightbulb, BookOpen, CornerDownRight } from 'lucide-react';

interface Question {
  id: number;
  content: string;
  position: number;
  sampleAnswer?: string;
  partNumber?: number;
  questionCategory?: string;
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

const PART_BADGE: Record<number, { label: string; gradient: string }> = {
  1: { label: 'Part 1', gradient: 'from-blue-400 to-blue-500' },
  2: { label: 'Part 2', gradient: 'from-purple-400 to-purple-500' },
  3: { label: 'Part 3', gradient: 'from-emerald-400 to-emerald-500' },
};

export function SpeakingQuestionCenter({
  question,
  showSample,
  onToggleSample,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: SpeakingQuestionCenterProps) {
  const partNum = question.partNumber ?? 1;
  const badge = PART_BADGE[partNum] || PART_BADGE[1];
  const isFollowUp = question.questionCategory === 'FOLLOW_UP';
  const isCueCard = partNum === 2;

  return (
    <div className="space-y-4">
      {/* Question card */}
      <div className={`rounded-3xl bg-white/80 backdrop-blur-sm border shadow-sm p-6 ${
        isCueCard ? 'border-purple-200/60' : 'border-orange-100/60'
      }`}>
        <div className="flex items-center gap-2.5 mb-4">
          <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${badge.gradient} text-white text-[11px] font-bold shadow-sm`}>
            {badge.label}
          </span>
          {isFollowUp ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 text-[11px] font-semibold border border-purple-200/50">
              <CornerDownRight className="h-3 w-3" /> Follow-up
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 text-white text-[11px] font-bold shadow-sm shadow-orange-300/30">
              Câu {question.position}
            </span>
          )}
        </div>

        {isCueCard ? (
          /* Part 2: Cue Card style */
          <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5">
            <div className="flex items-center gap-2 mb-3 text-purple-600">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-semibold">Chủ đề</span>
            </div>
            <p className="text-lg font-medium text-gray-800 leading-relaxed whitespace-pre-line">
              {question.content}
            </p>
          </div>
        ) : (
          /* Part 1 & 3: Regular question */
          <p className="text-lg font-medium text-gray-800 leading-relaxed">
            {isFollowUp && <span className="mr-1 text-purple-400">↳</span>}
            {question.content}
          </p>
        )}

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
                  <p className="text-xs font-bold text-green-700">Bài mẫu</p>
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
          Câu trước
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-orange-100/60 text-sm font-medium text-gray-600 hover:text-orange-600 hover:border-orange-200/60 hover:shadow-md hover:shadow-orange-100/20 transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          Câu tiếp
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
