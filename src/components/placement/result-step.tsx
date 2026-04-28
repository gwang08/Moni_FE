'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, Headphones, PenLine, Mic, ArrowRight, TrendingUp, CheckCircle2, ChevronRight } from 'lucide-react';
import type { PlacementResult, PlacementTestPair } from '@/types/placement.types';
import { SkillDetailModal } from '@/components/placement/skill-detail-modal';

export interface ResultStepProps {
  result: PlacementResult;
  testPair?: PlacementTestPair | null;
  readingAnswers?: Record<number, number>;
  readingTextAnswers?: Record<number, string>;
  listeningAnswers?: Record<number, number>;
  listeningTextAnswers?: Record<number, string>;
}

type SkillKey = 'reading' | 'listening' | 'writing' | 'speaking';

const SKILLS: {
  key: SkillKey;
  label: string;
  icon: typeof BookOpen;
  color: string;
  bg: string;
  border: string;
}[] = [
  { key: 'reading', label: 'Reading', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { key: 'listening', label: 'Listening', icon: Headphones, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  { key: 'writing', label: 'Writing', icon: PenLine, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { key: 'speaking', label: 'Speaking', icon: Mic, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
];

function getBandFromResult(result: PlacementResult, skill: SkillKey): number {
  const map: Record<SkillKey, number> = {
    reading: result.readingBand,
    listening: result.listeningBand,
    writing: result.writingBand,
    speaking: result.speakingBand,
  };
  return map[skill];
}

function getBandLevel(band: number): string {
  if (band === 0) return 'Chưa xác định';
  if (band <= 3) return 'Sơ cấp';
  if (band <= 4.5) return 'Cơ bản';
  if (band <= 5.5) return 'Trung cấp';
  if (band <= 6.5) return 'Trung cao';
  if (band <= 7.5) return 'Khá giỏi';
  if (band <= 8.5) return 'Giỏi';
  return 'Xuất sắc';
}

export function ResultStep({
  result,
  testPair,
  readingAnswers,
  readingTextAnswers,
  listeningAnswers,
  listeningTextAnswers,
}: ResultStepProps) {
  const router = useRouter();
  const [selectedSkill, setSelectedSkill] = useState<SkillKey | null>(null);

  const overallPct = (result.overallBand / 9) * 100;
  const circumference = 2 * Math.PI * 54;

  const getTestDetail = (skill: SkillKey) => {
    if (!testPair) return undefined;
    switch (skill) {
      case 'reading': return testPair.readingTest;
      case 'listening': return testPair.listeningTest;
      case 'writing': return testPair.writingTest;
      case 'speaking': return testPair.speakingTest;
    }
  };

  const getUserAnswers = (skill: SkillKey) => {
    if (skill === 'reading') return readingAnswers;
    if (skill === 'listening') return listeningAnswers;
    return undefined;
  };

  const getUserTextAnswers = (skill: SkillKey) => {
    if (skill === 'reading') return readingTextAnswers;
    if (skill === 'listening') return listeningTextAnswers;
    return undefined;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Kết quả đánh giá trình độ</h2>
          {result.isSelfAssessed ? (
            <span className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">
              Tự đánh giá
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-medium">
              <CheckCircle2 className="h-3 w-3" /> AI chấm điểm
            </span>
          )}
        </div>

        {/* Overall Band Card */}
        <div className="relative bg-white rounded-3xl shadow-lg shadow-gray-100/50 border border-gray-100 p-8 text-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-orange-500" />

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Overall Band</p>

          <div className="relative mx-auto w-36 h-36 mb-4">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke="url(#overallGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(overallPct / 100) * circumference} ${circumference}`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="overallGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-gray-900">{result.overallBand.toFixed(1)}</span>
              <span className="text-xs font-medium text-gray-400">{getBandLevel(result.overallBand)}</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full">
            <TrendingUp className="h-3.5 w-3.5" />
            Mục tiêu: {result.targetBand.toFixed(1)}
          </div>
        </div>

        {/* Skill Breakdown - Clickable */}
        <div className="grid grid-cols-2 gap-3">
          {SKILLS.map((skill) => {
            const band = getBandFromResult(result, skill.key);
            const reached = band >= result.targetBand;
            const Icon = skill.icon;
            return (
              <button
                key={skill.key}
                onClick={() => setSelectedSkill(skill.key)}
                className={`rounded-2xl border ${skill.border} ${skill.bg} p-4 space-y-2.5 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] text-left cursor-pointer group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg p-1.5 bg-white/70">
                      <Icon className={`h-4 w-4 ${skill.color}`} />
                    </div>
                    <span className={`text-xs font-bold ${skill.color} uppercase tracking-wide`}>{skill.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{band.toFixed(1)}</p>
                {reached ? (
                  <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Đạt mục tiêu
                  </p>
                ) : (
                  <p className="text-xs font-medium text-gray-500">
                    Cần thêm <span className="font-bold text-red-500">{(result.targetBand - band).toFixed(1)}</span>
                  </p>
                )}
                {skill.key === 'reading' && result.readingCorrect !== null && (
                  <p className="text-[11px] text-gray-400">{result.readingCorrect} câu đúng</p>
                )}
                {skill.key === 'listening' && result.listeningCorrect !== null && (
                  <p className="text-[11px] text-gray-400">{result.listeningCorrect} câu đúng</p>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400">Bấm vào từng kỹ năng để xem chi tiết chấm điểm</p>

        {/* CTA */}
        <Button
          onClick={() => {
            sessionStorage.setItem('showRoadmapTour', 'true');
            sessionStorage.setItem('triggerAiRecommendation', String(result.id));
            router.push('/dashboard');
          }}
          className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-200/50 transition-all"
        >
          Bắt đầu lộ trình học
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <SkillDetailModal
          skill={selectedSkill}
          result={result}
          testDetail={getTestDetail(selectedSkill)}
          userAnswers={getUserAnswers(selectedSkill)}
          userTextAnswers={getUserTextAnswers(selectedSkill)}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
}
