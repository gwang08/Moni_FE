'use client';

import { Loader2, Info, Star } from 'lucide-react';
import type { SpeakingFeedback } from '@/types/speaking.types';

interface SpeakingFeedbackPanelProps {
  feedback: SpeakingFeedback | null;
  isScoring: boolean;
  scoringError: string | null;
}

const SCORE_LABELS = [
  { key: 'fluency' as const, label: 'Độ lưu loát', color: 'from-orange-400 to-amber-400' },
  { key: 'pronunciation' as const, label: 'Phát âm', color: 'from-rose-400 to-pink-400' },
  { key: 'vocabulary' as const, label: 'Từ vựng', color: 'from-blue-400 to-indigo-400' },
  { key: 'grammar' as const, label: 'Ngữ pháp', color: 'from-emerald-400 to-teal-400' },
];

export function SpeakingFeedbackPanel({
  feedback,
  isScoring,
  scoringError,
}: SpeakingFeedbackPanelProps) {
  if (isScoring) {
    return (
      <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-orange-100/60 shadow-sm p-6 mt-4 flex items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
        </div>
        <span className="text-sm font-medium text-orange-600">
          {'Đang chấm điểm...'}
        </span>
      </div>
    );
  }

  if (scoringError) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-amber-50/80 to-orange-50/60 border border-amber-200/50 p-4 mt-4 flex gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100/80 flex items-center justify-center shrink-0">
          <Info className="h-4 w-4 text-amber-500" />
        </div>
        <p className="text-sm text-amber-700 leading-relaxed">
          {'Tính năng chấm điểm Speaking đang được phát triển. Vui lòng sử dụng bài mẫu để tự đánh giá.'}
        </p>
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-orange-100/60 shadow-sm p-6 mt-4 space-y-5">
      {/* Overall score circle */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center shadow-xl shadow-orange-300/30 border-4 border-white">
          <div className="text-center">
            <p className="text-3xl font-black text-white leading-none">
              {feedback.overallScore.toFixed(1)}
            </p>
            <p className="text-[10px] text-white/80 font-medium mt-0.5">Overall</p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3">
          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-gray-500">Band Score</span>
          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
        </div>
      </div>

      {/* Criteria grid */}
      <div className="grid grid-cols-2 gap-3">
        {SCORE_LABELS.map(({ key, label, color }) => (
          <div key={key} className="rounded-2xl bg-gradient-to-br from-gray-50/80 to-white border border-gray-100/60 p-3.5 hover:shadow-md hover:shadow-orange-100/20 transition-all duration-200">
            <p className="text-[11px] text-gray-400 font-medium mb-1">{label}</p>
            <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
              {feedback[key].toFixed(1)}
            </p>
          </div>
        ))}
      </div>

      {/* Comments */}
      {feedback.comments && (
        <div className="rounded-2xl bg-orange-50/50 border border-orange-100/40 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {'Nhận xét'}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{feedback.comments}</p>
        </div>
      )}
    </div>
  );
}
