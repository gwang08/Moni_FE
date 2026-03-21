'use client';

import { Volume2 } from 'lucide-react';

interface Props {
  isPlaying: boolean;
}

export function ExamAudioIndicator({ isPlaying }: Props) {
  if (!isPlaying) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
      <Volume2 className="h-5 w-5 animate-pulse" />
      <span className="text-sm font-medium">Đang phát audio...</span>
      {/* Animated bars */}
      <div className="flex items-end gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-blue-500"
            style={{
              height: `${8 + i * 4}px`,
              animation: `pulse ${0.4 + i * 0.15}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
