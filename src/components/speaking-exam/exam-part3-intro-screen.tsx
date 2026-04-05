'use client';

import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onStartNow: () => void;
}

export function ExamPart3IntroScreen({ onStartNow }: Props) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white min-h-[500px]">
      <div className="py-6 text-center">
        <h2 className="text-[20px] font-bold text-[#334155]">Part 3</h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center mb-10">
        <ul className="space-y-3 text-[#334155] max-w-lg text-left inline-block">
          <li className="leading-relaxed text-[15px]">Part 3 will take about 4 to 5 minutes.</li>
          <li className="leading-relaxed text-[15px]">
            In this part, we will discuss some more general questions related to the topic you just spoke about.
          </li>
        </ul>
      </div>

      <div className="flex justify-center border-t border-gray-100 p-5 bg-white shrink-0 mt-auto">
        <Button
          onClick={onStartNow}
          className="gap-2 rounded-full bg-[#ff7b42] px-8 py-5 text-[15px] text-white hover:bg-[#ea580c] shadow-sm font-medium"
        >
          <Play className="h-4 w-4 fill-current" />
          Start now
        </Button>
      </div>
    </div>
  );
}
