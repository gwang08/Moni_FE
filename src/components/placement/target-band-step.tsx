'use client';

import { Button } from '@/components/ui/button';
import { BandScoreSelect } from '@/components/placement/band-score-select';

interface Props {
  targetBand: number;
  onTargetBandChange: (v: number) => void;
  onContinue: () => void;
}

export function TargetBandStep({ targetBand, onTargetBandChange, onContinue }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mục tiêu band điểm của bạn</h2>
          <p className="text-sm text-gray-500">
            Chọn band điểm IELTS Overall mà bạn muốn đạt được
          </p>
        </div>

        <div className="mb-8">
          <BandScoreSelect
            label="Band điểm mục tiêu"
            value={targetBand}
            onChange={onTargetBandChange}
          />
        </div>

        <Button
          onClick={onContinue}
          disabled={targetBand === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
        >
          Tiếp tục
        </Button>

        {targetBand === 0 && (
          <p className="text-xs text-gray-400 text-center mt-2">Vui lòng chọn band điểm mục tiêu</p>
        )}
      </div>
    </div>
  );
}
