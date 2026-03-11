'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  mode: 'view' | 'edit';
  note: string;
  position: { x: number; y: number };
  onSave?: (note: string) => void;
  onClose: () => void;
}

export function NoteInlineEditor({ mode, note, position, onSave, onClose }: Props) {
  const [value, setValue] = useState(note);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === 'edit') inputRef.current?.focus();
  }, [mode]);

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.min(position.y + 8, window.innerHeight - 200),
    zIndex: 50,
  };

  if (mode === 'view') {
    return (
      <div style={style} className="w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-3 animate-in fade-in zoom-in-95 duration-100 pointer-events-none">
        <p className="text-sm text-gray-700 leading-relaxed">{note}</p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div style={style} className="w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-3 animate-in fade-in zoom-in-95 duration-100">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nhập ghi chú..."
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSave?.(value); }
            if (e.key === 'Escape') onClose();
          }}
        />
        <div className="flex justify-end gap-1.5 mt-2">
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-7 px-2" onClick={() => onSave?.(value)}>
            <Check className="h-3.5 w-3.5 mr-1" />
            Lưu
          </Button>
        </div>
      </div>
    </>
  );
}
