'use client';

import { Button } from '@/components/ui/button';
import { useReadingStore } from '@/store/reading-store';
import { Highlighter } from 'lucide-react';

const MOCK_PASSAGE = {
  title: 'The History of Coffee',
  content: `Coffee is one of the most popular beverages in the world. Its origins can be traced back to Ethiopia, where legend has it that a goat herder named Kaldi discovered coffee beans after noticing his goats became energetic after eating them. The cultivation of coffee spread to the Arabian Peninsula, where it became an integral part of social and cultural life.`,
};

export default function ReadingPage() {
  const { highlights, activeTool, selectedColor, addHighlight, setActiveTool, setColor } = useReadingStore();

  const handleTextSelection = () => {
    if (!activeTool) return;

    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;

    const text = selection.toString();
    addHighlight({
      text,
      startOffset: 0,
      endOffset: text.length,
      color: selectedColor,
    });

    selection.removeAllRanges();
  };

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold">{MOCK_PASSAGE.title}</h1>

        {/* Toolbar */}
        <div className="bg-white border rounded-lg p-4 flex items-center gap-4">
          <Button
            variant={activeTool === 'highlight' ? 'default' : 'outline'}
            onClick={() => setActiveTool(activeTool === 'highlight' ? null : 'highlight')}
          >
            <Highlighter className="h-4 w-4 mr-2" />
            Highlight
          </Button>

          {activeTool === 'highlight' && (
            <div className="flex gap-2">
              {(['yellow', 'green', 'blue'] as const).map((color) => (
                <button
                  key={color}
                  onClick={() => setColor(color)}
                  className={`w-8 h-8 rounded-full bg-${color}-300 border-2 ${
                    selectedColor === color ? 'border-black' : 'border-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Passage */}
        <div
          onMouseUp={handleTextSelection}
          className="prose max-w-none bg-white border rounded-lg p-6 select-text"
        >
          <p>{MOCK_PASSAGE.content}</p>
        </div>

        {/* Highlights sidebar */}
        {highlights.length > 0 && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-bold mb-3">Highlights ({highlights.length})</h3>
            <div className="space-y-2">
              {highlights.map((hl) => (
                <div key={hl.id} className={`p-3 rounded bg-${hl.color}-100 border-l-4 border-${hl.color}-400`}>
                  <p className="text-sm">{hl.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
