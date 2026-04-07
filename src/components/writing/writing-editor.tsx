'use client';

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { BookOpen, PenLine } from 'lucide-react';
import { useWritingStore } from '@/store/writing-store';
import type { WritingTaskType } from '@/types/writing.types';

interface WritingEditorProps {
  taskType?: WritingTaskType;
  sampleAnswer?: string;
  showSample: boolean;
  onToggleSample: () => void;
  readOnly?: boolean;
  /** Nội dung khởi tạo (từ draft đã lưu) — chia theo \n\n cho các section */
  initialContent?: string;
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

const SEPARATOR = '\n---SECTION---\n';

export function WritingEditor({ taskType = 2, sampleAnswer, showSample, onToggleSample, readOnly = false, initialContent }: WritingEditorProps) {
  const { setContent, setWordCount } = useWritingStore();
  const sections = SECTIONS[taskType] ?? SECTIONS[2];
  const textareasRef = useRef<(HTMLTextAreaElement | null)[]>([]);

  const [texts, setTexts] = useState<string[]>(() => {
    if (initialContent) {
      const parts = initialContent.split('\n\n');
      return sections.map((_, i) => parts[i] ?? '');
    }
    return sections.map(() => '');
  });
  const [savedTexts, setSavedTexts] = useState<string[]>([]);

  const sampleParts = sampleAnswer?.includes('---SECTION---')
    ? sampleAnswer.split(SEPARATOR).map(s => s.trim())
    : sampleAnswer ? [sampleAnswer] : [];

  useEffect(() => {
    setTexts(sections.map(() => ''));
  }, [taskType, sections]);

  useEffect(() => {
    if (showSample) {
      setSavedTexts(texts);
      setTexts(sections.map((_, i) => sampleParts[i] || ''));
    } else if (savedTexts.length > 0) {
      setTexts(savedTexts);
      setSavedTexts([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSample]);

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

  const resizeTextarea = useCallback((index: number) => {
    const el = textareasRef.current[index];
    if (!el) return;

    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    textareasRef.current.forEach((_, index) => resizeTextarea(index));
  }, [texts, showSample, readOnly, resizeTextarea, taskType]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b border-teal-100/40 flex items-center justify-between bg-white/50 backdrop-blur-sm">
        <p className="text-sm font-bold text-gray-700">{showSample ? 'Bài mẫu' : 'Bài làm'}</p>
        {sampleAnswer && (
          <button
            onClick={onToggleSample}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              showSample
                ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            {showSample ? <PenLine className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
            {showSample ? 'Quay lại làm bài' : 'Xem bài mẫu'}
          </button>
        )}
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
                ref={(el) => {
                  textareasRef.current[idx] = el;
                }}
                value={texts[idx]}
                onChange={(e) => {
                  handleTextChange(idx, e.target.value);
                  resizeTextarea(idx);
                }}
                placeholder={section.placeholder}
                disabled={showSample || readOnly}
                readOnly={readOnly}
                className={`w-full min-h-[140px] overflow-hidden rounded-2xl border px-4 py-3 text-sm leading-relaxed resize-none shadow-sm transition-all ${
                  readOnly
                    ? 'border-gray-200 bg-gray-50/80 text-gray-600 cursor-default'
                    : showSample
                    ? 'border-green-200 bg-green-50/60 text-gray-700 cursor-default'
                    : 'border-gray-200/80 bg-white/80 backdrop-blur-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-300/50 focus:border-teal-200 placeholder:text-gray-300 hover:shadow-md hover:border-teal-200/60'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
