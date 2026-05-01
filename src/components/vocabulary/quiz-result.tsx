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
  if (pct >= 80) return 'from-teal-400 to-teal-500';
  if (pct >= 50) return 'from-amber-400 to-orange-500';
  return 'from-rose-400 to-red-500';
}

export function QuizResult({ score, total, wrongAnswers, onRetry, onBack }: QuizResultProps) {
  const percentage = Math.round((score / total) * 100);
  const correct = score;
  const wrong = total - score;

  return (
    <div className={`grid grid-cols-1 ${wrongAnswers.length > 0 ? 'lg:grid-cols-[400px_1fr]' : ''} gap-8 items-start`}>
      <ChibiAnimationStyles />

      <div className="space-y-6 lg:sticky lg:top-8">
      {/* Score hero card */}
      <div className="relative rounded-3xl border border-gray-100 bg-gradient-to-b from-gray-50/80 via-white to-white p-8 shadow-lg shadow-gray-100/40 text-center space-y-5 overflow-hidden">


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
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#0d9488" />
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
        <div className="grid grid-cols-2 gap-4 max-w-[280px] mx-auto mt-4">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-teal-50/80 border border-teal-100 py-4 shadow-sm">
            <p className="text-3xl font-black text-teal-600">{correct}</p>
            <div className="flex items-center gap-1.5 text-teal-600 mt-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">Đúng</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-rose-50/80 border border-rose-100 py-4 shadow-sm">
            <p className="text-3xl font-black text-rose-500">{wrong}</p>
            <div className="flex items-center gap-1.5 text-rose-500 mt-1">
              <XCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">Sai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Button className="flex-1 rounded-2xl h-12 bg-teal-600 hover:bg-teal-700 font-bold" onClick={onRetry}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Chơi lại
        </Button>
      </div>
      </div>

      {/* Wrong answers */}
      {wrongAnswers.length > 0 && (
        <div className="space-y-4 lg:pl-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base">
            <XCircle className="h-5 w-5 text-rose-500" />
            Đánh giá câu trả lời sai
          </h3>
          <div className="space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 pb-8">
            {wrongAnswers.map(({ question, selectedIndex }, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <p className="text-sm font-semibold text-gray-800 leading-relaxed pb-3 border-b border-gray-100">{question.prompt}</p>
                
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/50">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-rose-500" />
                      <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">Bạn chọn</span>
                    </div>
                    <span className="text-sm text-rose-800 font-semibold">{question.options[selectedIndex]}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-teal-100 bg-teal-50/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-500" />
                      <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Đáp án đúng</span>
                    </div>
                    <span className="text-sm text-teal-800 font-semibold">{question.options[question.correctIndex]}</span>
                  </div>
                </div>

                {question.explanation && (
                  <div className="mt-4 p-3 rounded-xl bg-gray-50 text-xs text-gray-600 leading-relaxed">
                    <span className="font-bold text-gray-700 mr-1.5">Giải thích:</span>
                    {question.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
