'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WritingTaskType, WritingParagraphGuide } from '@/types/writing.types';

interface WritingToolbarPanelProps {
  wordCount: number;
  minWords: number;
  taskType: WritingTaskType;
  sampleAnswer?: string;
  showSample: boolean;
  onToggleSample: () => void;
}

// Paragraph structure guides per task type
const TASK1_GUIDE: WritingParagraphGuide[] = [
  { label: 'Mở bài', description: 'Paraphrase đề bài', placeholder: 'Giới thiệu biểu đồ/hình ảnh...' },
  { label: 'Tổng quan', description: 'Nêu xu hướng chính', placeholder: 'Overall, the chart shows...' },
  { label: 'Thân bài 1', description: 'Mô tả chi tiết phần 1', placeholder: 'Looking at the data...' },
  { label: 'Thân bài 2', description: 'Mô tả chi tiết phần 2', placeholder: 'In contrast / Furthermore...' },
];

const TASK2_GUIDE: WritingParagraphGuide[] = [
  { label: 'Mở bài', description: 'Giới thiệu chủ đề + luận điểm', placeholder: 'Introduce the topic...' },
  { label: 'Thân bài 1', description: 'Luận điểm chính 1 + dẫn chứng', placeholder: 'First, it is argued that...' },
  { label: 'Thân bài 2', description: 'Luận điểm chính 2 + dẫn chứng', placeholder: 'Furthermore / However...' },
  { label: 'Kết bài', description: 'Tóm tắt + kết luận', placeholder: 'In conclusion...' },
];

export function WritingToolbarPanel({
  wordCount,
  minWords,
  taskType,
  sampleAnswer,
  showSample,
  onToggleSample,
}: WritingToolbarPanelProps) {
  const [guideOpen, setGuideOpen] = useState(false);
  const guide = taskType === 1 ? TASK1_GUIDE : TASK2_GUIDE;
  const progress = Math.min(100, Math.round((wordCount / minWords) * 100));

  // Progress bar color
  const barColor =
    progress >= 100 ? 'bg-emerald-500' :
    progress >= 50 ? 'bg-yellow-400' :
    'bg-red-400';

  return (
    <div className="space-y-4">
      {/* Word count progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Số từ</span>
          <span className={progress >= 100 ? 'text-emerald-600 font-semibold' : ''}>
            {wordCount} / {minWords}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{progress}% yêu cầu tối thiểu</p>
      </div>

      {/* Paragraph structure guide (collapsible) */}
      <div className="border rounded-lg overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-3 py-2 bg-emerald-50 text-emerald-800 text-sm font-medium hover:bg-emerald-100 transition-colors"
          onClick={() => setGuideOpen((v) => !v)}
        >
          <span>Cấu trúc bài viết</span>
          {guideOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {guideOpen && (
          <div className="divide-y">
            {guide.map((item, idx) => (
              <div key={idx} className="px-3 py-2">
                <p className="text-xs font-semibold text-emerald-700">{item.label}</p>
                <p className="text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sample answer toggle */}
      {sampleAnswer && (
        <div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={onToggleSample}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {showSample ? 'Ẩn bài mẫu' : 'Hiện bài mẫu'}
          </Button>
          {showSample && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-gray-700 leading-relaxed max-h-64 overflow-y-auto">
              {sampleAnswer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
