'use client';

import { Mic } from 'lucide-react';

interface Props {
  text: string;
  isListening: boolean;
}

export function ExamTranscriptLive({ text, isListening }: Props) {
  if (!isListening && !text) return null;

  return (
    <div className="space-y-2">
      {isListening && (
        <div className="flex items-center gap-2 text-red-600">
          <Mic className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-medium">Đang nghe...</span>
        </div>
      )}
      {text && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm leading-relaxed text-gray-700 italic">{text}</p>
        </div>
      )}
    </div>
  );
}
