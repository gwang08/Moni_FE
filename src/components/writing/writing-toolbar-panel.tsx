'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Lightbulb, PenLine } from 'lucide-react';
import type { WritingTaskType } from '@/types/writing.types';

interface WritingToolbarPanelProps {
  wordCount: number;
  taskType: WritingTaskType;
  sampleAnswer?: string;
  showSample: boolean;
  onToggleSample: () => void;
}

const GUIDES: Record<number, { label: string; tip: string }[]> = {
  1: [
    { label: 'Introduction', tip: 'Paraphrase đề bài' },
    { label: 'Overview', tip: 'Nêu xu hướng chính' },
    { label: 'Body 1', tip: 'Mô tả chi tiết phần 1' },
    { label: 'Body 2', tip: 'Mô tả chi tiết phần 2' },
  ],
  2: [
    { label: 'Introduction', tip: 'Giới thiệu chủ đề và luận điểm' },
    { label: 'Body 1', tip: 'Luận điểm 1 và dẫn chứng' },
    { label: 'Body 2', tip: 'Luận điểm 2 và dẫn chứng' },
    { label: 'Conclusion', tip: 'Tóm tắt và kết luận' },
  ],
};

export function WritingToolbarPanel({
  wordCount,
  taskType,
  sampleAnswer,
  showSample,
  onToggleSample,
}: WritingToolbarPanelProps) {
  const [guideOpen, setGuideOpen] = useState(true);
  const guide = GUIDES[taskType] ?? GUIDES[2];

  return (
    <div className="space-y-4">
      {/* Word count card */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-teal-100/60 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <PenLine className="h-4 w-4 text-teal-400" />
          <span className="text-xs font-semibold text-gray-500">Số từ đã viết</span>
        </div>
        <p className="text-2xl font-black text-teal-600 tabular-nums">{wordCount}</p>
      </div>

      {/* Structure guide card */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-teal-100/60 overflow-hidden shadow-sm">
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-teal-50/30 transition-colors"
          onClick={() => setGuideOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <span className="text-sm font-bold text-gray-700">Cấu trúc bài viết</span>
          </div>
          {guideOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {guideOpen && (
          <div className="px-4 pb-3 space-y-2">
            {guide.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 py-1.5 border-t border-gray-50 first:border-0">
                <div className="w-5 h-5 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                  <p className="text-[11px] text-gray-400">{item.tip}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sample answer card */}
      {sampleAnswer && (
        <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-teal-100/60 overflow-hidden shadow-sm">
          <button
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-teal-50/30 transition-colors"
            onClick={onToggleSample}
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="text-sm font-bold text-gray-700">
              {showSample ? 'Ẩn bài mẫu' : 'Hiện bài mẫu'}
            </span>
          </button>
          {showSample && (
            <div className="px-4 pb-4">
              <div className="p-3 bg-teal-50/50 border border-teal-100/60 rounded-2xl text-[13px] text-gray-600 leading-relaxed max-h-60 overflow-y-auto">
                {sampleAnswer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
