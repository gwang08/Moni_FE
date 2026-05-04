'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, Headphones, PenLine, Mic, ArrowRight, TrendingUp, CheckCircle2, ChevronRight, Trophy, Target } from 'lucide-react';
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
  gradient: string;
  lightBg: string;
  border: string;
  text: string;
}[] = [
  { key: 'reading', label: 'READING', icon: BookOpen, gradient: 'from-blue-500 to-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' },
  { key: 'listening', label: 'LISTENING', icon: Headphones, gradient: 'from-violet-500 to-purple-600', lightBg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600' },
  { key: 'writing', label: 'WRITING', icon: PenLine, gradient: 'from-emerald-500 to-teal-600', lightBg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
  { key: 'speaking', label: 'SPEAKING', icon: Mic, gradient: 'from-orange-500 to-rose-500', lightBg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600' },
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

function getBandColor(band: number): string {
  if (band === 0) return 'text-gray-400';
  if (band <= 3) return 'text-red-500';
  if (band <= 4.5) return 'text-orange-500';
  if (band <= 5.5) return 'text-yellow-600';
  if (band <= 6.5) return 'text-blue-500';
  if (band <= 7.5) return 'text-teal-500';
  return 'text-emerald-500';
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
  const [animatedBand, setAnimatedBand] = useState(0);

  // Animate overall band number on mount
  useEffect(() => {
    const target = result.overallBand;
    if (target === 0) return;
    const duration = 1200;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, target);
      setAnimatedBand(Math.round(current * 10) / 10);
      if (step >= steps) {
        setAnimatedBand(target);
        clearInterval(timer);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [result.overallBand]);

  const overallPct = (result.overallBand / 9) * 100;
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (overallPct / 100) * circumference;

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
    <div className="flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-md space-y-5">

        {/* Header + Overall Band Card */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
          {/* Decorative orbs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-teal-500/20 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-blue-500/15 blur-2xl" />

          <div className="relative px-6 pt-6 pb-7">
            {/* Badge */}
            <div className="flex justify-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium border border-white/10">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                Kết quả đánh giá trình độ
                {result.isSelfAssessed && <span className="text-violet-300 ml-1">· Tự đánh giá</span>}
              </div>
            </div>

            {/* Gauge + Target row */}
            <div className="flex items-center justify-center gap-8">
              {/* Circular gauge */}
              <div className="relative w-32 h-32 shrink-0">
                {/* Glow effect behind the ring */}
                <div className="absolute inset-2 rounded-full bg-teal-400/10 blur-md" />
                <svg viewBox="0 0 120 120" className="w-full h-full relative" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="url(#bandGradient)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(20, 184, 166, 0.4))' }}
                  />
                  <defs>
                    <linearGradient id="bandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2dd4bf" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black tracking-tight text-white">
                    {animatedBand.toFixed(1)}
                  </span>
                  <span className="text-[11px] font-medium text-white/50 mt-0.5">
                    {getBandLevel(result.overallBand)}
                  </span>
                </div>
              </div>

              {/* Info column */}
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-1">Overall Band</p>
                  <div className="h-px w-8 bg-gradient-to-r from-teal-400/60 to-transparent" />
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <Target className="h-3.5 w-3.5 text-teal-400" />
                  <span className="text-sm font-semibold text-white/80">
                    Mục tiêu: <span className="text-teal-300 font-bold">{result.targetBand.toFixed(1)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {SKILLS.map((skill) => {
            const band = getBandFromResult(result, skill.key);
            const reached = band >= result.targetBand;
            const notAttempted = band === 0;
            const Icon = skill.icon;
            const barPct = Math.min((band / result.targetBand) * 100, 100);

            return (
              <button
                key={skill.key}
                onClick={() => setSelectedSkill(skill.key)}
                className={`
                  relative rounded-2xl border ${skill.border} bg-white p-4 space-y-2.5
                  transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-0.5
                  active:scale-[0.98] text-left cursor-pointer group overflow-hidden
                `}
              >
                {/* Subtle gradient accent at top */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${skill.gradient} opacity-80`} />

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-lg p-1.5 bg-gradient-to-br ${skill.gradient} shadow-sm`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className={`text-[11px] font-extrabold ${skill.text} uppercase tracking-wider`}>
                      {skill.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>

                {/* Score */}
                {notAttempted ? (
                  <p className="text-2xl font-bold text-gray-300">—</p>
                ) : (
                  <p className="text-2xl font-black text-gray-900">{band.toFixed(1)}</p>
                )}

                {/* Progress bar */}
                {!notAttempted ? (
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${skill.gradient}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-1.5 bg-gray-100 rounded-full" />
                )}

                {/* Status */}
                {notAttempted ? (
                  <p className="text-xs text-gray-400">Chưa làm bài</p>
                ) : reached ? (
                  <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Đạt mục tiêu
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Cần thêm <span className="font-bold text-red-500">{(result.targetBand - band).toFixed(1)}</span>
                  </p>
                )}

                {skill.key === 'reading' && result.readingCorrect !== null && !notAttempted && (
                  <p className="text-[10px] text-gray-400">{result.readingCorrect} câu đúng</p>
                )}
                {skill.key === 'listening' && result.listeningCorrect !== null && !notAttempted && (
                  <p className="text-[10px] text-gray-400">{result.listeningCorrect} câu đúng</p>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400">
          Bấm vào từng kỹ năng để xem chi tiết chấm điểm
        </p>

        {/* CTA */}
        <Button
          onClick={() => {
            sessionStorage.setItem('showRoadmapTour', 'true');
            sessionStorage.setItem('triggerAiRecommendation', String(result.id));
            router.push('/dashboard');
          }}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
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
