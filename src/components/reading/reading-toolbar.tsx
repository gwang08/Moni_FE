'use client';

import { Button } from '@/components/ui/button';
import { useReadingStore } from '@/store/reading-store';
import { Highlighter, StickyNote, BookOpen, GraduationCap, BookMarked } from 'lucide-react';
import { useEffect } from 'react';

export function ReadingToolbar() {
  const { activeTool, selectedColor, setActiveTool, setColor, mode, setMode } = useReadingStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'h' || e.key === 'H') {
        setActiveTool(activeTool === 'highlight' ? null : 'highlight');
      }
      if (e.key === 'n' || e.key === 'N') {
        setActiveTool(activeTool === 'note' ? null : 'note');
      }
      if ((e.key === 't' || e.key === 'T') && mode === 'practice') {
        setActiveTool(activeTool === 'vocab' ? null : 'vocab');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTool, mode, setActiveTool]);

  return (
    <div className="flex items-center gap-2 p-4 bg-white border-b flex-wrap">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 mr-4 border-r pr-4">
        <Button
          variant={mode === 'practice' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('practice')}
          className="gap-2"
        >
          <BookMarked className="h-4 w-4" />
          Luyện tập
        </Button>
        <Button
          variant={mode === 'exam' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('exam')}
          className="gap-2"
        >
          <GraduationCap className="h-4 w-4" />
          Thi thử
        </Button>
      </div>

      {/* Tools */}
      <Button
        variant={activeTool === 'highlight' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveTool(activeTool === 'highlight' ? null : 'highlight')}
        className="gap-2"
      >
        <Highlighter className="h-4 w-4" />
        Highlight (H)
      </Button>

      <Button
        variant={activeTool === 'note' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveTool(activeTool === 'note' ? null : 'note')}
        className="gap-2"
      >
        <StickyNote className="h-4 w-4" />
        Ghi chú (N)
      </Button>

      {mode === 'practice' && (
        <Button
          variant={activeTool === 'vocab' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool(activeTool === 'vocab' ? null : 'vocab')}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Từ vựng (T)
        </Button>
      )}

      {/* Color picker for highlight tool */}
      {activeTool === 'highlight' && (
        <div className="flex gap-1 ml-4">
          {(['yellow', 'green', 'blue'] as const).map((color) => (
            <button
              key={color}
              onClick={() => setColor(color)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                selectedColor === color ? 'border-black scale-110' : 'border-gray-300'
              } ${color === 'yellow' ? 'bg-yellow-300' : color === 'green' ? 'bg-green-300' : 'bg-blue-300'}`}
              aria-label={color}
            />
          ))}
        </div>
      )}

      {/* Tool hint */}
      {activeTool && (
        <span className="text-sm text-muted-foreground ml-auto">
          {activeTool === 'highlight' && 'Chọn text để highlight'}
          {activeTool === 'note' && 'Chọn text hoặc click highlight để thêm ghi chú'}
          {activeTool === 'vocab' && 'Chọn từ để thêm vào danh sách từ vựng'}
        </span>
      )}
    </div>
  );
}
