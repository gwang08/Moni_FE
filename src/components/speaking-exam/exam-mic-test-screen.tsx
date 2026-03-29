'use client';

import { Mic, Play, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMicTest } from '@/hooks/use-mic-test';
import { useRef } from 'react';

interface Props {
  onStartTest: () => void;
  onSkip: () => void;
}

export function ExamMicTestScreen({ onStartTest, onSkip }: Props) {
  const mic = useMicTest(20);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-10 text-center text-lg font-bold tracking-wide text-[#2d3748]">
        TEST YOUR MICROPHONE
      </h2>

      {/* Instructions */}
      <div className="mb-10 px-8">
        <ul className="space-y-2 text-[#2d3748]">
          <li>• You have 20 seconds to speak.</li>
          <li>• To complete this activity, you must allow access to your system&apos;s microphone.</li>
          <li>
            • Click the button <span className="font-bold">&quot;Test microphone&quot;</span> below to Start.
          </li>
        </ul>
      </div>

      {/* Recording indicator */}
      {mic.isRecording && (
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-600">Recording...</span>
          </div>
          <span className="text-2xl font-bold tabular-nums text-[#2d3748]">
            {formatTime(mic.recordingTime)} / 00:20
          </span>
          <Button
            onClick={mic.stopRecording}
            variant="outline"
            className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
          >
            Stop recording
          </Button>
        </div>
      )}

      {/* Audio player after recording */}
      {mic.hasRecorded && mic.audioUrl && !mic.isRecording && (
        <div className="mb-6 border-t border-gray-200 pt-4">
          {/* Playback bar */}
          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <audio
              ref={audioRef}
              src={mic.audioUrl}
              controls
              className="w-full"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => {
                mic.reset();
                mic.startRecording();
              }}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>

            <Button
              onClick={onStartTest}
              className="gap-2 rounded-full bg-[#f97316] px-8 py-3 text-white hover:bg-[#ea580c]"
            >
              <Play className="h-4 w-4" />
              Start test
            </Button>
          </div>
        </div>
      )}

      {/* Initial state buttons */}
      {!mic.isRecording && !mic.hasRecorded && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div /> {/* spacer */}
          <Button
            onClick={mic.startRecording}
            className="gap-2 rounded-full bg-[#f97316] px-8 py-3 text-white hover:bg-[#ea580c]"
          >
            <Mic className="h-4 w-4" />
            Test microphone
          </Button>
          <button
            onClick={onSkip}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            <SkipForward className="h-4 w-4" />
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
