'use client';

import { Loader2, Info } from 'lucide-react';
import type { SpeakingFeedback } from '@/types/speaking.types';

interface SpeakingFeedbackPanelProps {
  feedback: SpeakingFeedback | null;
  isScoring: boolean;
  scoringError: string | null;
}

const SCORE_LABELS = [
  { key: 'fluency' as const, label: 'Độ lưu loát' },
  { key: 'pronunciation' as const, label: 'Phát âm' },
  { key: 'vocabulary' as const, label: 'Từ vựng' },
  { key: 'grammar' as const, label: 'Ngữ pháp' },
];

export function SpeakingFeedbackPanel({
  feedback,
  isScoring,
  scoringError,
}: SpeakingFeedbackPanelProps) {
  if (isScoring) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6 mt-4 flex items-center justify-center gap-3 text-orange-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Đang chấm điểm...</span>
      </div>
    );
  }

  if (scoringError) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 flex gap-3">
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 leading-relaxed">
          Tính năng chấm điểm Speaking đang được phát triển. Vui lòng sử dụng bài mẫu để tự đánh giá.
        </p>
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mt-4 space-y-4">
      {/* Overall score */}
      <div className="text-center py-4 bg-gradient-to-r from-orange-400 to-amber-500 rounded-lg text-white">
        <p className="text-xs uppercase tracking-wider mb-1">Overall Band Score</p>
        <p className="text-4xl font-bold">{feedback.overallScore.toFixed(1)}</p>
      </div>

      {/* Criteria grid */}
      <div className="grid grid-cols-2 gap-3">
        {SCORE_LABELS.map(({ key, label }) => (
          <div key={key} className="border rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-orange-600">{feedback[key].toFixed(1)}</p>
          </div>
        ))}
      </div>

      {/* Comments */}
      {feedback.comments && (
        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Nhận xét</p>
          <p className="text-sm text-gray-700 leading-relaxed">{feedback.comments}</p>
        </div>
      )}
    </div>
  );
}
