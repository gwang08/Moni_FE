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
}

const SECTIONS: Record<number, SectionConfig[]> = {
  1: [
    { label: 'Introduction', placeholder: 'Nhập phần viết của bạn ở đây' },
    { label: 'Overview', placeholder: 'Nhập phần viết của bạn ở đây' },
    { label: 'Body 1', placeholder: 'Nhập phần viết của bạn ở đây' },
    { label: 'Body 2', placeholder: 'Nhập phần viết của bạn ở đây' },
  ],
  2: [
    { label: 'Introduction', placeholder: 'Nhập phần viết của bạn ở đây' },
    { label: 'Body 1', placeholder: 'Nhập phần viết của bạn ở đây' },
    { label: 'Body 2', placeholder: 'Nhập phần viết của bạn ở đây' },
    { label: 'Conclusion', placeholder: 'Nhập phần viết của bạn ở đây' },
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
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="px-5 py-3 border-b bg-white flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Bài làm</p>
        <p className="text-sm text-gray-500">
          Word count: <span className="font-semibold text-gray-700">{totalWords}</span>
        </p>
      </div>

      {/* All sections stacked */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {sections.map((section, idx) => (
          <div key={idx}>
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">
              {section.label}
            </label>
            <textarea
              value={texts[idx]}
              onChange={(e) => handleTextChange(idx, e.target.value)}
              placeholder={section.placeholder}
              rows={5}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-gray-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
