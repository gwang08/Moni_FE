'use client';

import { Button } from '@/components/ui/button';
import { Mic, StopCircle } from 'lucide-react';
import { ExamTranscriptLive } from './exam-transcript-live';

interface Props {
  speakTimer: number;
  transcript: string;
  isListening: boolean;
  onStop: () => void;
}

export function ExamSpeakingTimer({ speakTimer, transcript, isListening, onStop }: Props) {
  const isUrgent = speakTimer <= 15;
  const minutes = Math.floor(speakTimer / 60);
  const seconds = speakTimer % 60;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
          Part 2 — Đang nói
        </span>
        <div className="flex items-center gap-1 text-red-500">
          <Mic className="h-4 w-4 animate-pulse" />
          <span className="text-xs font-medium">REC</span>
        </div>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-500">Thời gian còn lại</p>
        <div
          className={`text-5xl font-bold tabular-nums ${isUrgent ? 'text-red-600 animate-pulse' : 'text-green-700'}`}
        >
          {minutes}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      {/* Live transcript */}
      <ExamTranscriptLive text={transcript} isListening={isListening} />

      {/* Stop button */}
      <div className="flex justify-center">
        <Button onClick={onStop} variant="destructive" size="lg" className="gap-2">
          <StopCircle className="h-5 w-5" />
          Dừng nói
        </Button>
      </div>
    </div>
  );
}
