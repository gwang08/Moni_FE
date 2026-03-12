'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { WritingTaskType } from '@/types/writing.types';

interface WritingPromptPanelProps {
  prompt: string;
  chartImageUrl?: string;
  taskType: WritingTaskType;
  minWords: number;
}

export function WritingPromptPanel({
  prompt,
  chartImageUrl,
  taskType,
  minWords,
}: WritingPromptPanelProps) {
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Task type label + word requirement */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-emerald-700">
          Writing Task {taskType}
        </span>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
          Tối thiểu {minWords} từ
        </Badge>
      </div>

      {/* Chart image (Task 1 only) */}
      {chartImageUrl && (
        <div
          className="cursor-zoom-in rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-400 transition-colors"
          onClick={() => setZoomOpen(true)}
          title="Nhấp để phóng to"
        >
          <Image
            src={chartImageUrl}
            alt="Biểu đồ đề bài"
            width={400}
            height={300}
            className="w-full object-contain bg-white"
            unoptimized
          />
        </div>
      )}

      {/* Prompt text */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
          Đề bài
        </h3>
        <p className="text-gray-800 leading-relaxed text-sm">{prompt}</p>
      </div>

      {/* Zoom dialog */}
      {chartImageUrl && (
        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogContent className="max-w-3xl">
            <Image
              src={chartImageUrl}
              alt="Biểu đồ đề bài (phóng to)"
              width={800}
              height={600}
              className="w-full object-contain"
              unoptimized
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
