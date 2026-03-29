'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onStartNow: () => void;
}

export function ExamPart2IntroScreen({ onStartNow }: Props) {
  const [note, setNote] = useState('');

  return (
    <div className="flex gap-4">
      {/* Main content */}
      <div className="flex-1 rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-[#f0f7ff] py-4 text-center">
          <h2 className="text-lg font-bold text-blue-700">Part 2</h2>
        </div>

        <div className="p-8">
          <ul className="mb-10 space-y-4 text-[#2d3748]">
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

          <div className="flex justify-center">
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
      <div className="w-56 flex-shrink-0 overflow-hidden rounded-lg border border-yellow-300">
        <div className="bg-[#fbbf24] px-4 py-3 text-center font-bold text-[#2d3748]">
          Note
        </div>
        <div className="bg-[#fffde7] p-3">
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
