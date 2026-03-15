'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuizQuestion } from '@/types/vocab.types';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuizQuestionCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onNext: (selectedIndex: number) => void;
}

export function QuizQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onNext,
}: QuizQuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (selected !== null) return; // already answered
    setSelected(idx);
  };

  const getOptionStyle = (idx: number) => {
    if (selected === null) {
      return 'border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50';
    }
    if (idx === question.correctIndex) {
      return 'border-green-500 bg-green-50 text-green-800';
    }
    if (idx === selected && idx !== question.correctIndex) {
      return 'border-red-400 bg-red-50 text-red-700';
    }
    return 'border-gray-200 text-gray-400';
  };

  const getOptionIcon = (idx: number) => {
    if (selected === null) return null;
    if (idx === question.correctIndex) return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
    if (idx === selected) return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Câu {questionNumber} / {totalQuestions}</span>
          <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 p-6 text-center">
        <p className="text-lg font-semibold text-gray-900">{question.prompt}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={selected !== null}
            className={`flex items-center gap-3 w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${getOptionStyle(idx)}`}
          >
            <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="flex-1">{opt}</span>
            {getOptionIcon(idx)}
          </button>
        ))}
      </div>

      {/* Explanation + Next */}
      {selected !== null && (
        <div className="space-y-4">
          {question.explanation && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <span className="font-semibold">Giải thích: </span>{question.explanation}
            </div>
          )}
          <Button
            className="w-full"
            onClick={() => {
              onNext(selected);
              setSelected(null);
            }}
          >
            Tiếp
          </Button>
        </div>
      )}
    </div>
  );
}
