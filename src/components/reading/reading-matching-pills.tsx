'use client';

import { useMemo } from 'react';
import type { QuestionDetail } from '@/types/test.types';

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface Props {
  questions: QuestionDetail[];
  answers: Record<number, number>;
  submitted: boolean;
  selectedPillId: number | null;
  onPillSelect: (id: number | null) => void;
}

/** Heading pills for matching headings - click to select, then click drop zone on passage */
export function ReadingMatchingPills({ questions, answers, submitted, selectedPillId, onPillSelect }: Props) {
  const allOptions = useMemo(() => {
    const opts = questions[0]?.options || [];
    return seededShuffle(opts, questions[0]?.id || 0);
  }, [questions]);

  // answers stores each question's OWN option ID. Translate to pill option IDs by content.
  const usedPillContents = useMemo(() => {
    const contents = new Set<string>();
    for (const q of questions) {
      const answerId = answers[q.id];
      if (answerId) {
        const opt = q.options.find(o => o.id === answerId);
        if (opt) contents.add(opt.content);
      }
    }
    return contents;
  }, [questions, answers]);

  const handleClick = (optionId: number) => {
    if (submitted) return;
    onPillSelect(selectedPillId === optionId ? null : optionId);
  };

  const handleDragStart = (e: React.DragEvent, optionId: number) => {
    e.dataTransfer.setData('text/plain', String(optionId));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 italic">Choose a heading, then click the matching slot in the passage (or drag and drop).</p>

      {selectedPillId && !submitted && (
        <p className="text-xs text-blue-600 animate-pulse">Click a slot on the left to assign the heading.</p>
      )}

      <div className="flex flex-col gap-2">
        {allOptions.filter(opt => !usedPillContents.has(opt.content)).map((opt) => {
          const isActive = selectedPillId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              draggable={!submitted}
              onDragStart={(e) => handleDragStart(e, opt.id)}
              onClick={() => handleClick(opt.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm cursor-pointer'
                  : submitted
                    ? 'bg-white text-gray-700 border-gray-300 cursor-default'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-grab shadow-sm hover:shadow'
              }`}
            >
              {opt.content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
