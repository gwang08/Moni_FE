'use client';

import { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { BookOpen, PenLine, Plus, Trash2, Layout, Type } from 'lucide-react';
import { useWritingStore } from '@/store/writing-store';
import type { WritingTaskType } from '@/types/writing.types';

interface WritingEditorProps {
  taskType?: WritingTaskType;
  sampleAnswer?: string;
  showSample: boolean;
  onToggleSample: () => void;
  readOnly?: boolean;
}

interface SectionConfig {
  label: string;
  placeholder: string;
  color: string;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function parseContent(content: string | undefined): string[] {
  if (!content) return [];
  if (content.includes('\n---SECTION---\n')) {
    return content.split('\n---SECTION---\n').map(s => s.trim());
  }
  
  // Standardize HTML/line breaks
  const clean = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
    
  return clean.split(/\n\s*\n+/).map(p => p.trim()).filter(p => p.length > 0);
}

function getSectionsForCount(taskType: number, count: number): SectionConfig[] {
  const minCount = 4;
  const actualCount = Math.max(count, minCount);
  
  if (taskType === 1) {
    const sections: SectionConfig[] = [
      { label: 'Introduction', placeholder: 'Viết phần mở bài - paraphrase lại đề bài...', color: 'from-teal-400 to-teal-500' },
      { label: 'Overview', placeholder: 'Viết phần tổng quan - nêu xu hướng chính...', color: 'from-emerald-400 to-emerald-500' },
    ];
    for (let i = 1; i <= actualCount - 2; i++) {
      sections.push({
        label: `Body ${i}`,
        placeholder: `Viết thân bài ${i} - mô tả chi tiết...`,
        color: i % 2 === 1 ? 'from-blue-400 to-blue-500' : 'from-violet-400 to-violet-500'
      });
    }
    return sections;
  } else {
    const sections: SectionConfig[] = [
      { label: 'Introduction', placeholder: 'Viết phần mở bài - giới thiệu chủ đề và luận điểm...', color: 'from-teal-400 to-teal-500' },
    ];
    for (let i = 1; i <= actualCount - 2; i++) {
      sections.push({
        label: `Body ${i}`,
        placeholder: `Viết thân bài ${i} - luận điểm và dẫn chứng...`,
        color: i % 2 === 1 ? 'from-emerald-400 to-emerald-500' : 'from-blue-400 to-blue-500'
      });
    }
    sections.push({ label: 'Conclusion', placeholder: 'Viết phần kết bài - tóm tắt và khẳng định lại quan điểm...', color: 'from-violet-400 to-violet-500' });
    return sections;
  }
}

export function WritingEditor({ taskType = 2, sampleAnswer, showSample, onToggleSample, readOnly = false }: WritingEditorProps) {
  const { setContent, setWordCount } = useWritingStore();
  const textareasRef = useRef<(HTMLTextAreaElement | null)[]>([]);
  const singleTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [viewMode, setViewMode] = useState<'segmented' | 'single'>('segmented');

  // State cho bài làm của user
  const [userTexts, setUserTexts] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse bài mẫu
  const sampleTexts = useMemo(() => parseContent(sampleAnswer), [sampleAnswer]);

  // Khởi tạo userTexts từ store hoặc mặc định
  useEffect(() => {
    if (isInitialized) return;
    const storeContent = useWritingStore.getState().content;
    const parts = parseContent(storeContent);
    const initialCount = Math.max(parts.length, 4);
    const initialTexts = Array(initialCount).fill('').map((_, i) => parts[i] ?? '');
    setUserTexts(initialTexts);
    setIsInitialized(true);
  }, [isInitialized]);

  // Cập nhật khi taskType thay đổi
  useEffect(() => {
    const storeContent = useWritingStore.getState().content;
    if (!storeContent) {
      setUserTexts(Array(4).fill(''));
    } else {
      const parts = parseContent(storeContent);
      const count = Math.max(parts.length, 4);
      setUserTexts(Array(count).fill('').map((_, i) => parts[i] ?? ''));
    }
  }, [taskType]);

  // Hiện thị texts nào (user hay sample)
  const currentTexts = showSample ? sampleTexts : userTexts;
  const sections = getSectionsForCount(taskType, currentTexts.length);
  const fullContent = currentTexts.join('\n\n');

  const syncStore = useCallback(
    (updatedTexts: string[]) => {
      const combined = updatedTexts.map(t => t.trim()).filter(Boolean).join('\n\n');
      setContent(combined);
      setWordCount(countWords(combined));
    },
    [setContent, setWordCount]
  );

  const handleTextChange = (index: number, value: string) => {
    if (showSample || readOnly) return;
    const updated = [...userTexts];
    updated[index] = value;
    setUserTexts(updated);
    syncStore(updated);
  };

  const handleFullContentChange = (value: string) => {
    if (showSample || readOnly) return;
    setContent(value);
    setWordCount(countWords(value));
    
    // Đồng bộ ngược lại userTexts khi chuyển về segmented
    const parts = parseContent(value);
    if (parts.length >= 4) {
      setUserTexts(parts);
    } else {
      // Đảm bảo tối thiểu 4 ô
      const updated = Array(4).fill('').map((_, i) => parts[i] ?? '');
      setUserTexts(updated);
    }
  };

  const addBodyParagraph = () => {
    if (showSample || readOnly) return;
    const updated = [...userTexts];
    if (taskType === 2) {
      updated.splice(updated.length - 1, 0, '');
    } else {
      updated.push('');
    }
    setUserTexts(updated);
    syncStore(updated);
  };

  const removeBodyParagraph = (index: number) => {
    if (showSample || readOnly || userTexts.length <= 4) return;
    const updated = [...userTexts];
    updated.splice(index, 1);
    setUserTexts(updated);
    syncStore(updated);
  };

  const resizeTextarea = useCallback((index: number) => {
    const el = textareasRef.current[index];
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const resizeSingleTextarea = useCallback(() => {
    const el = singleTextareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.max(el.scrollHeight, 400)}px`;
  }, []);

  useLayoutEffect(() => {
    if (viewMode === 'segmented') {
      currentTexts.forEach((_, index) => resizeTextarea(index));
    } else {
      resizeSingleTextarea();
    }
  }, [currentTexts, showSample, readOnly, resizeTextarea, resizeSingleTextarea, taskType, viewMode]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b border-teal-100/40 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <p className="text-sm font-bold text-gray-700">{showSample ? 'Bài mẫu' : 'Bài làm'}</p>
          
          {/* View Mode Toggle */}
          {!showSample && (
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode('segmented')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  viewMode === 'segmented' 
                    ? 'bg-white text-teal-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Layout className="h-3 w-3" />
                Phân đoạn
              </button>
              <button
                onClick={() => setViewMode('single')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  viewMode === 'single' 
                    ? 'bg-white text-teal-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Type className="h-3 w-3" />
                Toàn bài
              </button>
            </div>
          )}

          {!showSample && !readOnly && viewMode === 'segmented' && (
            <button
              onClick={addBodyParagraph}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-teal-50 text-teal-600 text-[10px] font-bold hover:bg-teal-100 transition-colors border border-teal-100"
            >
              <Plus className="h-3 w-3" />
              Thêm Body
            </button>
          )}
        </div>
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {viewMode === 'segmented' || showSample ? (
          <div className="space-y-4">
            {sections.map((section, idx) => {
              const contentValue = currentTexts[idx] || '';
              const words = countWords(contentValue);
              const isBody = section.label.startsWith('Body');
              const canDelete = !showSample && !readOnly && isBody && userTexts.length > 4;

              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
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
                    
                    {canDelete && (
                      <button
                        onClick={() => removeBodyParagraph(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Xóa đoạn này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  <textarea
                    ref={(el) => {
                      textareasRef.current[idx] = el;
                    }}
                    value={contentValue}
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
        ) : (
          <div className="h-full flex flex-col">
            <textarea
              ref={singleTextareaRef}
              value={useWritingStore.getState().content}
              onChange={(e) => {
                handleFullContentChange(e.target.value);
                resizeSingleTextarea();
              }}
              placeholder="Viết toàn bộ bài làm của bạn ở đây..."
              readOnly={readOnly}
              className={`w-full flex-1 overflow-hidden rounded-2xl border px-5 py-4 text-sm leading-relaxed resize-none shadow-sm transition-all min-h-[500px] ${
                readOnly
                  ? 'border-gray-200 bg-gray-50/80 text-gray-600 cursor-default'
                  : 'border-gray-200/80 bg-white/80 backdrop-blur-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-300/50 focus:border-teal-200 placeholder:text-gray-300 hover:shadow-md hover:border-teal-200/60'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
