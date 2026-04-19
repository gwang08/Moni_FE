'use client';

import { Button } from '@/components/ui/button';
import { QuizQuestion } from '@/types/vocab.types';
import { RotateCcw, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';

interface WrongAnswer {
  question: QuizQuestion;
  selectedIndex: number;
}

interface QuizResultProps {
  score: number;
  total: number;
  wrongAnswers: WrongAnswer[];
  onRetry: () => void;
  onBack: () => void;
}

function getScoreMood(pct: number): 'excited' | 'happy' | 'sad' {
  if (pct >= 80) return 'excited';
  if (pct >= 50) return 'happy';
  return 'sad';
}

function getScoreMessage(pct: number): string {
  if (pct === 100) return 'Hoàn hảo! Bạn trả lời đúng tất cả!';
  if (pct >= 80) return 'Xuất sắc! Bạn học rất tốt!';
  if (pct >= 50) return 'Không tệ! Cố gắng thêm nhé!';
  return 'Đừng nản lòng! Ôn luyện thêm nhé!';
}

function getScoreGradient(pct: number): string {
  if (pct >= 80) return 'from-emerald-400 to-teal-500';
  if (pct >= 50) return 'from-amber-400 to-orange-500';
  return 'from-rose-400 to-red-500';
}

export function QuizResult({ score, total, wrongAnswers, onRetry, onBack }: QuizResultProps) {
  const percentage = Math.round((score / total) * 100);
  const correct = score;
  const wrong = total - score;

  return (
    <div className="space-y-6">
      <ChibiAnimationStyles />

      {/* Score hero card */}
      <div className="relative rounded-3xl border border-gray-100 bg-gradient-to-b from-gray-50/80 via-white to-white p-8 shadow-lg shadow-gray-100/40 text-center space-y-5 overflow-hidden">
        {/* Background accent ring */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <div className="w-64 h-64 rounded-full border-[32px] border-current" />
        </div>

        <ChibiMascot mood={getScoreMood(percentage)} size={80} />

        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Kết quả</h2>
          <p className="text-sm text-gray-500 mt-1">{getScoreMessage(percentage)}</p>
        </div>

        {/* Score ring */}
        <div className="relative mx-auto w-32 h-32">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * 327} 327`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {percentage >= 80 ? (
                  <>
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </>
                ) : percentage >= 50 ? (
                  <>
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f97316" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </>
                )}
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-gray-900">{score}/{total}</span>
            <span className="text-xs font-medium text-gray-400">{percentage}%</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div className="text-left">
              <p className="text-lg font-extrabold text-emerald-600">{correct}</p>
              <p className="text-[11px] font-medium text-emerald-400">Đúng</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="text-left">
              <p className="text-lg font-extrabold text-red-500">{wrong}</p>
              <p className="text-[11px] font-medium text-red-300">Sai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wrong answers */}
      {wrongAnswers.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4 text-red-400" />
            Câu trả lời sai ({wrongAnswers.length})
          </h3>
          <div className="space-y-2.5">
            {wrongAnswers.map(({ question, selectedIndex }, i) => (
              <div key={i} className="rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/80 to-white p-4 space-y-2.5">
                <p className="text-sm font-semibold text-gray-800 leading-relaxed">{question.prompt}</p>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 text-red-600 font-semibold px-2 py-0.5 flex-shrink-0">
                      <XCircle className="h-3 w-3" /> Bạn chọn
                    </span>
                    <span className="text-red-600 font-medium">{question.options[selectedIndex]}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 flex-shrink-0">
                      <CheckCircle2 className="h-3 w-3" /> Đúng
                    </span>
                    <span className="text-emerald-700 font-medium">{question.options[question.correctIndex]}</span>
                  </div>
                  {question.explanation && (
                    <p className="text-gray-500 italic mt-1 pl-1 border-l-2 border-gray-200 ml-1">{question.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Button className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700" onClick={onRetry}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Chơi lại
        </Button>
      </div>
    </div>
  );
}
