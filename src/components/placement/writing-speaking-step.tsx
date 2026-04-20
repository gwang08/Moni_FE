'use client';

import { Button } from '@/components/ui/button';
import { BandScoreSelect } from '@/components/placement/band-score-select';
import { Target, Loader2 } from 'lucide-react';

interface WritingSpeakingBands {
  writing: number;
  speaking: number;
}

interface Props {
  bands: WritingSpeakingBands;
  onBandChange: (skill: keyof WritingSpeakingBands, value: number) => void;
  onComplete: () => void;
  loading: boolean;
}

export function WritingSpeakingStep({ bands, onBandChange, onComplete, loading }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 mx-auto">
            <Target className="h-7 w-7 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Tự đánh giá Writing & Speaking
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">
              Chọn band điểm bạn nghĩ phù hợp nhất với trình độ hiện tại
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 p-6 space-y-5">
          <BandScoreSelect label="Writing" value={bands.writing} onChange={(v) => onBandChange('writing', v)} />

          <div className="border-t border-gray-100" />

          <BandScoreSelect label="Speaking" value={bands.speaking} onChange={(v) => onBandChange('speaking', v)} />
        </div>

        {/* Hint */}
        <p className="text-center text-xs text-gray-400">
          Bạn có thể chọn "0 — Chưa xác định" nếu chưa biết trình độ của mình
        </p>

        {/* Submit */}
        <Button
          onClick={onComplete}
          disabled={loading}
          className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-200/50 transition-all"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang xử lý...
            </span>
          ) : 'Hoàn thành'}
        </Button>
      </div>
    </div>
  );
}
