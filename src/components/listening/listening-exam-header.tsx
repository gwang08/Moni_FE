'use client';

import { Volume2, Wifi, Bell, Menu, Clock } from 'lucide-react';

interface Props {
  isPlaying: boolean;
  elapsedTime?: string;
}

export function ListeningExamHeader({ isPlaying, elapsedTime }: Props) {
  return (
    <header className="shrink-0 flex items-center justify-between px-4 py-2 bg-white border-b border-gray-300">
      {/* Left: IELTS Logo + Timer */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {/* IELTS Logo */}
          <span className="text-[26px] font-bold tracking-tight" style={{ color: '#C8102E' }}>
            IELTS<sup className="text-[10px] font-normal">™</sup>
          </span>
        </div>
        {elapsedTime && (
          <div className="flex items-center gap-1.5 text-gray-900">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-mono font-semibold">{elapsedTime}</span>
          </div>
        )}
        {isPlaying && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <Volume2 className="h-4 w-4" />
            <span className="text-xs">Audio is Playing</span>
          </div>
        )}
      </div>

      {/* Right: Icons */}
      <div className="flex items-center gap-4">
        <Wifi className="h-5 w-5 text-gray-700" />
        <Bell className="h-5 w-5 text-gray-700" />
        <Menu className="h-6 w-6 text-gray-700" />
      </div>
    </header>
  );
}
