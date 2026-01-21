'use client';

import { useReadingStore } from '@/store/reading-store';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotesSidebar() {
  const { highlights, removeHighlight } = useReadingStore();

  return (
    <div className="w-80 bg-white border-l p-4 overflow-y-auto">
      <h3 className="font-bold mb-4">Ghi chú & Highlight</h3>

      {highlights.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Chưa có ghi chú. Chọn text và bấm H để highlight.
        </p>
      ) : (
        <div className="space-y-3">
          {highlights.map((hl) => (
            <div
              key={hl.id}
              className={`p-3 rounded border-l-4 ${
                hl.color === 'yellow'
                  ? 'border-yellow-400 bg-yellow-50'
                  : hl.color === 'green'
                  ? 'border-green-400 bg-green-50'
                  : 'border-blue-400 bg-blue-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium line-clamp-2">{hl.text}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => removeHighlight(hl.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              {hl.note && (
                <p className="text-xs text-muted-foreground italic">{hl.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
