'use client';

import { BookOpen } from 'lucide-react';

interface Props {
  topic: string;
  prepTimer: number;
}

export function ExamCueCardDisplay({ topic, prepTimer }: Props) {
  const isUrgent = prepTimer <= 10;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700">
          Part 2 — Cue Card
        </span>
      </div>

      {/* Cue card */}
      <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-8">
        <div className="mb-4 flex items-center gap-2 text-purple-600">
          <BookOpen className="h-5 w-5" />
          <span className="text-sm font-medium">Chủ đề</span>
        </div>
        <p className="text-lg leading-relaxed whitespace-pre-line text-gray-800">{topic}</p>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-500">Thời gian chuẩn bị</p>
        <div
          className={`text-4xl font-bold tabular-nums ${isUrgent ? 'text-red-600 animate-pulse' : 'text-purple-700'}`}
        >
          {Math.floor(prepTimer / 60)}:{String(prepTimer % 60).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}
