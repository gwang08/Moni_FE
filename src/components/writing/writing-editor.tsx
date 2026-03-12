'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWritingStore } from '@/store/writing-store';
import type { WritingTaskType } from '@/types/writing.types';

interface WritingEditorProps {
  taskType?: WritingTaskType;
}

interface SectionConfig {
  label: string;
  placeholder: string;
  color: string;
}

const SECTIONS: Record<number, SectionConfig[]> = {
  1: [
    { label: 'Introduction', placeholder: 'Viết phần mở bài - paraphrase lại đề bài...', color: 'from-teal-400 to-teal-500' },
    { label: 'Overview', placeholder: 'Viết phần tổng quan - nêu xu hướng chính...', color: 'from-emerald-400 to-emerald-500' },
    { label: 'Body 1', placeholder: 'Viết thân bài 1 - mô tả chi tiết phần đầu...', color: 'from-blue-400 to-blue-500' },
    { label: 'Body 2', placeholder: 'Viết thân bài 2 - mô tả chi tiết phần sau...', color: 'from-violet-400 to-violet-500' },
  ],
  2: [
    { label: 'Introduction', placeholder: 'Viết phần mở bài - giới thiệu chủ đề và luận điểm...', color: 'from-teal-400 to-teal-500' },
    { label: 'Body 1', placeholder: 'Viết thân bài 1 - luận điểm chính và dẫn chứng...', color: 'from-emerald-400 to-emerald-500' },
    { label: 'Body 2', placeholder: 'Viết thân bài 2 - luận điểm tiếp theo và dẫn chứng...', color: 'from-blue-400 to-blue-500' },
    { label: 'Conclusion', placeholder: 'Viết phần kết bài - tóm tắt và khẳng định lại quan điểm...', color: 'from-violet-400 to-violet-500' },
  ],
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export function WritingEditor({ taskType = 2 }: WritingEditorProps) {
  const { setContent, setWordCount } = useWritingStore();
  const sections = SECTIONS[taskType] ?? SECTIONS[2];

  const [texts, setTexts] = useState<string[]>(() => sections.map(() => ''));

  useEffect(() => {
    setTexts(sections.map(() => ''));
  }, [taskType, sections]);

  const syncStore = useCallback(
    (updatedTexts: string[]) => {
      const combined = updatedTexts.filter((t) => t.trim()).join('\n\n');
      setContent(combined);
      setWordCount(countWords(combined));
    },
    [setContent, setWordCount]
  );

  const handleTextChange = (index: number, value: string) => {
    const updated = [...texts];
    updated[index] = value;
    setTexts(updated);
    syncStore(updated);
  };

  const totalWords = countWords(texts.filter((t) => t.trim()).join('\n\n'));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b border-teal-100/40 flex items-center justify-between bg-white/50 backdrop-blur-sm">
        <p className="text-sm font-bold text-gray-700">Bài làm</p>
    
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {sections.map((section, idx) => {
          const words = countWords(texts[idx]);
          return (
            <div key={idx} className="group">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-6 h-6 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-sm`}>
                  <span className="text-[10px] font-bold text-white">{idx + 1}</span>
                </div>
                <span className="text-sm font-bold text-gray-700">{section.label}</span>
                {words > 0 && (
                  <span className="text-[10px] text-teal-500 bg-teal-50 px-2 py-0.5 rounded-full tabular-nums font-medium">
                    {words} từ
                  </span>
                )}
              </div>
              <textarea
                value={texts[idx]}
                onChange={(e) => handleTextChange(idx, e.target.value)}
                placeholder={section.placeholder}
                rows={5}
                className="w-full rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm text-gray-800 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-teal-300/50 focus:border-teal-200 placeholder:text-gray-300 shadow-sm transition-all hover:shadow-md hover:border-teal-200/60"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
