'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuizQuestion } from '@/types/vocab.types';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

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
      return 'border-gray-200 text-gray-700 hover:border-orange-400 hover:bg-orange-50 hover:scale-[1.02] hover:shadow-md';
    }
    if (idx === question.correctIndex) {
      return 'border-green-500 bg-green-50 text-green-800 scale-100 shadow-none';
    }
    if (idx === selected && idx !== question.correctIndex) {
      return 'border-red-400 bg-red-50 text-red-700 scale-100 shadow-none';
    }
    return 'border-gray-200 text-gray-400 scale-100 shadow-none';
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
        <div className="flex justify-between text-xs font-semibold text-gray-500">
          <span>Câu {questionNumber} / {totalQuestions}</span>
          <span className="text-orange-600">{Math.round((questionNumber / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-rose-400 rounded-full transition-all duration-500"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="rounded-3xl bg-white shadow-xl shadow-orange-100/50 border border-orange-100/50 py-10 px-6 sm:px-10 text-center transform transition-all">
        <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-relaxed tracking-tight select-none">
          {question.prompt}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={selected !== null}
            className={`group flex items-center gap-4 w-full rounded-2xl border-2 px-5 py-4 text-left text-base font-semibold transition-all duration-300 ease-out focus:outline-none ${getOptionStyle(idx)}`}
          >
            <span className="w-8 h-8 rounded-xl bg-white/60 border-2 border-inherit flex items-center justify-center text-sm font-bold shrink-0 transition-transform group-hover:scale-110">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="flex-1">{opt}</span>
            {getOptionIcon(idx)}
          </button>
        ))}
      </div>

      {/* Explanation + Next */}
      {selected !== null && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-2">
          {question.explanation && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-800 flex gap-3 shadow-inner">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Giải thích</span>
                <p className="leading-relaxed">{question.explanation}</p>
              </div>
            </div>
          )}
          <Button
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-orange-200/50 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 transform transition-all active:scale-[0.98]"
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
