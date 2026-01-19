'use client';

import { useListeningStore } from '@/store/listening-store';
import type { TranscriptSegment } from '@/types/listening.types';

interface TranscriptViewProps {
  segments: TranscriptSegment[];
}

export function TranscriptView({ segments }: TranscriptViewProps) {
  const { currentTime } = useListeningStore();

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
            className={`p-3 rounded transition-all ${
              isActive(segment) ? 'bg-blue-100 border-l-4 border-blue-600' : 'bg-gray-50'
            }`}
          >
            <p className={isActive(segment) ? 'font-semibold' : 'text-gray-700'}>
              {segment.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
