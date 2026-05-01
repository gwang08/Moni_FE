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
      return 'border-gray-200 text-gray-700 hover:border-teal-400 hover:bg-teal-50 hover:scale-[1.01] hover:shadow-sm';
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
    <div className="space-y-4 sm:space-y-5">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-gray-500">
          <span>Câu {questionNumber} / {totalQuestions}</span>
          <span className="text-teal-600">{Math.round((questionNumber / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="rounded-2xl bg-white shadow-lg shadow-teal-100/40 border border-teal-100/50 py-6 px-5 sm:py-8 sm:px-8 text-center transform transition-all">
        <p className="text-lg sm:text-xl font-bold text-gray-800 leading-relaxed tracking-tight select-none">
          {question.prompt}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-2.5">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={selected !== null}
            className={`group flex items-center gap-3 w-full rounded-xl border-2 px-4 py-3 text-left text-sm sm:text-base font-semibold transition-all duration-300 ease-out focus:outline-none ${getOptionStyle(idx)}`}
          >
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/60 border-2 border-inherit flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 transition-transform group-hover:scale-110">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="flex-1">{opt}</span>
            {getOptionIcon(idx)}
          </button>
        ))}
      </div>

      {/* Explanation + Next */}
      {selected !== null && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-1">
          {question.explanation && (
            <div className="rounded-xl bg-teal-50 border border-teal-100 p-3.5 sm:p-4 text-sm text-gray-700 flex gap-3 shadow-sm">
              <Lightbulb className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-teal-600 block mb-1">Giải thích</span>
                <p className="leading-relaxed">{question.explanation}</p>
              </div>
            </div>
          )}
          <Button
            className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-teal-200/50 bg-teal-600 hover:bg-teal-700 transform transition-all active:scale-[0.98]"
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
