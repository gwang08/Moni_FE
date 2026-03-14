'use client';

import { Button } from '@/components/ui/button';
import { BandScoreSelect } from '@/components/placement/band-score-select';

interface SelfBands {
  reading: number;
  listening: number;
  writing: number;
  speaking: number;
}

interface Props {
  bands: SelfBands;
  onBandChange: (skill: keyof SelfBands, value: number) => void;
  onComplete: () => void;
  loading: boolean;
}

export function SelfAssessStep({ bands, onBandChange, onComplete, loading }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tự đánh giá trình độ</h2>
          <p className="text-sm text-gray-500">Nhập band điểm bạn tự đánh giá cho từng kỹ năng</p>
        </div>

        <div className="space-y-4 mb-8">
          <BandScoreSelect label="Reading" value={bands.reading} onChange={(v) => onBandChange('reading', v)} />
          <BandScoreSelect label="Listening" value={bands.listening} onChange={(v) => onBandChange('listening', v)} />
          <BandScoreSelect label="Writing" value={bands.writing} onChange={(v) => onBandChange('writing', v)} />
          <BandScoreSelect label="Speaking" value={bands.speaking} onChange={(v) => onBandChange('speaking', v)} />
        </div>

        <Button
          onClick={onComplete}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang xử lý...
            </span>
          ) : 'Hoàn thành'}
        </Button>
      </div>
    </div>
  );
}
