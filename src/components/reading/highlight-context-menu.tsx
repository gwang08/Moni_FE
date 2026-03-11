'use client';

import { Trash2, StickyNote } from 'lucide-react';

interface Props {
  type: 'highlight' | 'note';
  position: { x: number; y: number };
  onAddNote?: () => void;
  onDeleteHighlight?: () => void;
  onDeleteNote?: () => void;
  onClose: () => void;
}

export function HighlightContextMenu({ type, position, onAddNote, onDeleteHighlight, onDeleteNote, onClose }: Props) {
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 200),
    top: Math.min(position.y + 6, window.innerHeight - 120),
    zIndex: 50,
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div style={style} className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
        {type === 'highlight' && (
          <>
            <button
              onClick={() => { onAddNote?.(); onClose(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <StickyNote className="h-4 w-4 text-blue-500" />
              Thêm ghi chú
            </button>
            <button
              onClick={() => { onDeleteHighlight?.(); onClose(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Xóa highlight
            </button>
          </>
        )}
        {type === 'note' && (
          <button
            onClick={() => { onDeleteNote?.(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Xóa ghi chú
          </button>
        )}
      </div>
    </>
  );
}
