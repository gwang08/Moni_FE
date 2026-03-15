'use client';

import { Button } from '@/components/ui/button';
import { QuizQuestion } from '@/types/vocab.types';
import { Trophy, RotateCcw, ArrowLeft, XCircle } from 'lucide-react';

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

export function QuizResult({ score, total, wrongAnswers, onRetry, onBack }: QuizResultProps) {
  const percentage = Math.round((score / total) * 100);

  const scoreColor =
    percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="text-center space-y-3 py-6">
        <Trophy className={`h-14 w-14 mx-auto ${percentage >= 70 ? 'text-yellow-500' : 'text-gray-400'}`} />
        <h2 className="text-2xl font-bold text-gray-900">Kết quả</h2>
        <p className={`text-5xl font-extrabold ${scoreColor}`}>{score}/{total}</p>
        <p className="text-gray-500">{percentage}% chính xác</p>
        {percentage === 100 && (
          <p className="text-green-600 font-medium">Hoàn hảo! Bạn trả lời đúng tất cả!</p>
        )}
      </div>

      {/* Wrong answers */}
      {wrongAnswers.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            Câu trả lời sai ({wrongAnswers.length})
          </h3>
          <div className="space-y-3">
            {wrongAnswers.map(({ question, selectedIndex }, i) => (
              <div key={i} className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-gray-800">{question.prompt}</p>
                <div className="text-xs space-y-1">
                  <p className="text-red-600">
                    Bạn chọn: <span className="font-medium">{question.options[selectedIndex]}</span>
                  </p>
                  <p className="text-green-700">
                    Đúng: <span className="font-medium">{question.options[question.correctIndex]}</span>
                  </p>
                  {question.explanation && (
                    <p className="text-gray-500 italic">{question.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Button className="flex-1" onClick={onRetry}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Chơi lại
        </Button>
      </div>
    </div>
  );
}
