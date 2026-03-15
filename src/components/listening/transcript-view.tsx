'use client';

import { useListeningStore } from '@/store/listening-store';
import type { TranscriptSegment } from '@/types/listening.types';

interface TranscriptViewProps {
  segments: TranscriptSegment[];
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function TranscriptView({ segments }: TranscriptViewProps) {
  const { currentTime, seekTo } = useListeningStore();

  const isActive = (segment: TranscriptSegment): boolean => {
    return currentTime >= segment.startTime && currentTime < segment.endTime;
  };

  return (
    <div className="bg-white border rounded-lg p-6 max-h-[500px] overflow-y-auto">
      <h3 className="font-bold mb-4">Transcript</h3>
      <div className="space-y-3">
        {segments.map((segment) => (
          <div
            key={segment.id}
            onClick={() => seekTo(segment.startTime)}
            className={`p-3 rounded transition-all cursor-pointer hover:bg-blue-50 ${
              isActive(segment) ? 'bg-blue-100 border-l-4 border-blue-600' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {segment.speaker && (
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {segment.speaker}
                </span>
              )}
              <span className="text-[10px] text-gray-400 font-mono">
                {formatTimestamp(segment.startTime)}
              </span>
            </div>
            <p className={isActive(segment) ? 'font-semibold' : 'text-gray-700'}>
              {segment.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
