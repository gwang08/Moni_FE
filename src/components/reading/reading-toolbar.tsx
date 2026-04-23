'use client';

import { Button } from '@/components/ui/button';
import { useReadingStore } from '@/store/reading-store';
import { Highlighter, StickyNote, BookOpen } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  showVocab?: boolean;
  onFinish?: () => void;
  examMode?: boolean;
}

export function ReadingToolbar({ showVocab = true, onFinish, examMode = false }: Props) {
  const { activeTool, selectedColor, setActiveTool, setColor } = useReadingStore();

  useEffect(() => {
    // ... (keep keypress logic)
  }, [activeTool, setActiveTool, showVocab]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-300 flex-wrap relative">
      {/* Tools */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setActiveTool(activeTool === 'highlight' ? null : 'highlight')}
        className={`gap-2 h-8 px-3 rounded text-[13px] font-semibold transition-colors ${
          activeTool === 'highlight' 
            ? 'bg-[#16a34a] text-white hover:bg-[#15803d]' 
            : 'bg-[#16a34a] text-white hover:bg-[#15803d]'
        }`}
      >
        <Highlighter className="h-4 w-4" />
        Highlight (H)
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setActiveTool(activeTool === 'note' ? null : 'note')}
        className={`gap-2 h-8 px-3 rounded text-[13px] font-semibold border border-gray-300 transition-colors ${
          activeTool === 'note' 
            ? 'bg-gray-100 text-gray-900' 
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <StickyNote className="h-4 w-4" />
        Ghi chú (N)
      </Button>

      {/* Color picker for highlight tool */}
      <div className="flex items-center gap-1.5 ml-4 border-l border-gray-200 pl-4">
        {(['yellow', 'green', 'blue'] as const).map((color) => (
          <button
            key={color}
            onClick={() => {
              setColor(color);
              if (activeTool !== 'highlight') setActiveTool('highlight');
            }}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              selectedColor === color && activeTool === 'highlight' ? 'border-gray-900 scale-110 shadow-sm' : 'border-transparent'
            } ${color === 'yellow' ? 'bg-[#fef08a]' : color === 'green' ? 'bg-[#bbf7d0]' : 'bg-[#bfdbfe]'}`}
            aria-label={color}
          />
        ))}
      </div>

      {showVocab && (
        <Button
          variant={activeTool === 'vocab' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool(activeTool === 'vocab' ? null : 'vocab')}
          className="gap-2 ml-4 h-8 px-3 rounded text-[13px]"
        >
          <BookOpen className="h-4 w-4" />
          Từ vựng (T)
        </Button>
      )}

      {/* Tool hint */}
      <span className="text-[11px] text-gray-500 ml-4 font-medium italic hidden lg:inline">
        {activeTool === 'highlight' && 'Chọn text để highlight'}
        {activeTool === 'note' && 'Chọn text hoặc click highlight để thêm ghi chú'}
        {activeTool === 'vocab' && 'Chọn từ để tra nghĩa'}
        {!activeTool && 'Chọn text để highlight hoặc ghi chú'}
      </span>
    </div>
  );
}
