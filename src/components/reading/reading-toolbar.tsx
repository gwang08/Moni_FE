'use client';

import { Button } from '@/components/ui/button';
import { useReadingStore } from '@/store/reading-store';
import { Highlighter } from 'lucide-react';
import { useEffect } from 'react';

export function ReadingToolbar() {
  const { activeTool, selectedColor, setActiveTool, setColor } = useReadingStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'h' || e.key === 'H') {
        setActiveTool(activeTool === 'highlight' ? null : 'highlight');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTool, setActiveTool]);

  return (
    <div className="flex items-center gap-2 p-4 bg-white border-b">
      <Button
        variant={activeTool === 'highlight' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveTool(activeTool === 'highlight' ? null : 'highlight')}
        className="gap-2"
      >
        <Highlighter className="h-4 w-4" />
        Highlight (H)
      </Button>

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
    </div>
  );
}
