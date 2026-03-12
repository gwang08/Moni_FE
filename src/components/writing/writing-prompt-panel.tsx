'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FileText, ZoomIn } from 'lucide-react';
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
      {/* Task label */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center shadow-sm">
          <FileText className="h-4 w-4 text-teal-600" />
        </div>
        <span className="text-sm font-bold text-gray-800">Writing Task {taskType}</span>
      </div>

      {/* Prompt card */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-teal-100/60 p-5 shadow-sm hover:shadow-md transition-shadow">
        <p className="text-[11px] font-bold text-teal-500 uppercase tracking-wider mb-2.5">
          Đề bài
        </p>
        <p className="text-[13px] text-gray-700 leading-relaxed">{prompt}</p>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-medium border border-amber-200/60">
            Tối thiểu {minWords} từ
          </span>
        </div>
      </div>

      {/* Chart image */}
      {chartImageUrl && (
        <div
          className="group relative rounded-3xl overflow-hidden border border-teal-100/60 cursor-zoom-in hover:border-teal-200 transition-all shadow-sm hover:shadow-md bg-white"
          onClick={() => setZoomOpen(true)}
        >
          <Image
            src={chartImageUrl}
            alt="Biểu đồ đề bài"
            width={400}
            height={300}
            className="w-full object-contain bg-white p-2"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2.5 shadow-lg">
              <ZoomIn className="h-4 w-4 text-teal-600" />
            </div>
          </div>
        </div>
      )}

      {/* Zoom dialog */}
      {chartImageUrl && (
        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogContent className="max-w-3xl rounded-3xl">
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
