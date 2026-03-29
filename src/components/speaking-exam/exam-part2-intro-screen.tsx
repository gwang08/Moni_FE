'use client';

import { useState } from 'react';
import { Play, Mic, PauseCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onStartNow: () => void;
}

export function ExamPart2IntroScreen({ onStartNow }: Props) {
  const [note, setNote] = useState('');

  return (
    <div className="flex gap-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-gray-100 bg-[#f0f7ff] py-4 text-center">
          <h2 className="text-lg font-bold text-blue-700">Part 2</h2>
        </div>

        <div className="flex flex-1 flex-col justify-between p-8">
          <ul className="space-y-4 text-[#2d3748]">
            <li className="leading-relaxed">• Part 2 will take about 3 to 4 minutes.</li>
            <li className="leading-relaxed">
              • In this part, you will be given a topic card and you will have 1-2 minutes to talk
              about it.
            </li>
            <li className="leading-relaxed">
              • Before you talk, you will have exactly 1 minute to prepare, and you can make some
              notes on the paper provided if you wish.
            </li>
          </ul>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={onStartNow}
              className="gap-2 rounded-full bg-[#f97316] px-8 py-3 text-white hover:bg-[#ea580c]"
            >
              <Play className="h-4 w-4" />
              Start now
            </Button>
          </div>
        </div>
      </div>

      {/* Note sidebar */}
      <div className="w-56 flex-shrink-0 border-l border-yellow-300">
        <div className="bg-[#fbbf24] px-4 py-3 text-center font-bold text-[#2d3748]">
          Note
        </div>
        <div className="h-full bg-[#fffde7] p-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            className="h-64 w-full resize-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Part 2 Cue Card screen — shows topic card + note sidebar + thinking timer
 * User can click to skip thinking time early
 */
interface CueCardWithNoteProps {
  topic: string;
  prepTimer: number;
  onSkipPrep: () => void;
}

export function ExamPart2CueCardWithNote({ topic, prepTimer, onSkipPrep }: CueCardWithNoteProps) {
  const [note, setNote] = useState('');

  // Parse cue card topic — if it contains bullet points / "You should say:"
  const lines = topic.split('\n').filter(Boolean);
  const title = lines[0] || topic;
  const hasSubPoints = lines.length > 1;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="flex gap-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-gray-100 bg-[#f0f7ff] py-4 text-center">
          <h2 className="text-lg font-bold text-blue-700">Part 2</h2>
        </div>

        <div className="flex flex-1 flex-col p-8">
          {/* Cue card content */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-[#f97316]">{title}</h3>
            {hasSubPoints && (
              <div>
                <p className="mb-2 text-sm text-gray-600">You should say:</p>
                <ul className="space-y-2">
                  {lines.slice(1).map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-[#2d3748]">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                      <span>{line.replace(/^[-•*]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!hasSubPoints && (
              <p className="text-[#2d3748] leading-relaxed whitespace-pre-line">{topic}</p>
            )}
          </div>
        </div>

        {/* Timer footer */}
        <div className="border-t border-gray-100 py-4 text-center">
          <p className="mb-1 text-sm text-gray-500">Thinking time</p>
          <span className="text-lg font-bold tabular-nums text-green-600">
            {formatTime(prepTimer)}
          </span>
          <div className="mt-3 flex justify-center gap-3">
            <Button
              onClick={onSkipPrep}
              className="gap-2 rounded-full bg-[#f97316] px-6 py-2 text-sm text-white hover:bg-[#ea580c]"
            >
              <Mic className="h-4 w-4" />
              Recording will start after thinking time
            </Button>
          </div>
          <button
            onClick={onSkipPrep}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            <PauseCircle className="mr-1 inline h-3 w-3" />
            I&apos;m ready, skip thinking time
          </button>
        </div>
      </div>

      {/* Note sidebar */}
      <div className="w-56 flex-shrink-0 border-l border-yellow-300">
        <div className="bg-[#fbbf24] px-4 py-3 text-center font-bold text-[#2d3748]">
          Note
        </div>
        <div className="h-full bg-[#fffde7] p-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            className="h-64 w-full resize-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
