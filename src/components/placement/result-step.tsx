'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { PlacementResult } from '@/types/placement.types';

interface Props {
  result: PlacementResult;
}

type SkillKey = 'reading' | 'listening' | 'writing' | 'speaking';

const SKILL_LABELS: Record<SkillKey, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
};

const SKILL_COLORS: Record<SkillKey, string> = {
  reading: 'bg-blue-50 border-blue-200 text-blue-700',
  listening: 'bg-purple-50 border-purple-200 text-purple-700',
  writing: 'bg-green-50 border-green-200 text-green-700',
  speaking: 'bg-pink-50 border-pink-200 text-pink-700',
};

const SKILLS: SkillKey[] = ['reading', 'listening', 'writing', 'speaking'];

function getBandFromResult(result: PlacementResult, skill: SkillKey): number {
  const map: Record<SkillKey, number> = {
    reading: result.readingBand,
    listening: result.listeningBand,
    writing: result.writingBand,
    speaking: result.speakingBand,
  };
  return map[skill];
}

function getComparisonColor(band: number, target: number): string {
  const diff = target - band;
  if (diff <= 0) return 'text-green-600';
  if (diff <= 1.0) return 'text-yellow-600';
  return 'text-red-500';
}

export function ResultStep({ result }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Kết quả đánh giá trình độ</h2>
          {result.isSelfAssessed && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Tự đánh giá</span>
          )}
        </div>

        {/* Overall band circle */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Overall Band</span>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">{result.overallBand.toFixed(1)}</span>
            </div>
            <span className={`text-sm font-medium ${getComparisonColor(result.overallBand, result.targetBand)}`}>
              Mục tiêu: {result.targetBand.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Skill bands grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {SKILLS.map((skill) => {
            const band = getBandFromResult(result, skill);
            const compColor = getComparisonColor(band, result.targetBand);
            return (
              <div key={skill} className={`rounded-xl border p-3 ${SKILL_COLORS[skill]}`}>
                <p className="text-xs font-medium opacity-70 mb-1">{SKILL_LABELS[skill]}</p>
                <p className="text-xl font-bold">{band.toFixed(1)}</p>
                <p className={`text-xs font-medium mt-0.5 ${compColor}`}>
                  {band >= result.targetBand ? '✓ Đạt mục tiêu' : `Cần thêm ${(result.targetBand - band).toFixed(1)}`}
                </p>
                {/* Show correct counts for reading/listening */}
                {skill === 'reading' && result.readingCorrect !== null && (
                  <p className="text-xs opacity-60 mt-0.5">{result.readingCorrect} câu đúng</p>
                )}
                {skill === 'listening' && result.listeningCorrect !== null && (
                  <p className="text-xs opacity-60 mt-0.5">{result.listeningCorrect} câu đúng</p>
                )}
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => {
            sessionStorage.setItem('showRoadmapTour', 'true');
            router.push('/dashboard');
          }}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
        >
          Quay lại Dashboard
        </Button>
      </div>
    </div>
  );
}
