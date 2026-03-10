'use client';

import { useReadingStore } from '@/store/reading-store';
import { Trash2, Edit2, Check, X, Highlighter, BookOpen, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotesSidebar({ open, onOpenChange }: Props) {
  const {
    highlights,
    removeHighlight,
    vocabList,
    removeVocab,
    addNote,
    editingHighlightId,
    setEditingHighlightId,
  } = useReadingStore();

  const [noteInput, setNoteInput] = useState('');

  const handleStartEdit = (highlightId: string, currentNote?: string) => {
    setEditingHighlightId(highlightId);
    setNoteInput(currentNote || '');
  };

  const handleSaveNote = (highlightId: string) => {
    addNote(highlightId, noteInput);
    setNoteInput('');
  };

  const handleCancelEdit = () => {
    setEditingHighlightId(null);
    setNoteInput('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        showOverlay={false}
        className="w-80 sm:w-96 overflow-y-auto border-l shadow-2xl p-0"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Highlighter className="h-5 w-5 text-blue-600" />
            Ghi chú & Highlight
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {highlights.length} highlight · {vocabList.length} từ vựng
          </p>
        </SheetHeader>

        <div className="px-5 py-4 space-y-5">
          {/* Highlights section */}
          {highlights.length === 0 ? (
            <div className="text-center py-8">
              <Highlighter className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Chưa có highlight nào.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Chọn text trong bài đọc và bấm <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono border">H</kbd> để highlight
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {highlights.map((hl) => (
                <div
                  key={hl.id}
                  className={`p-3 rounded-lg border-l-4 transition-shadow hover:shadow-sm ${
                    hl.color === 'yellow' ? 'border-yellow-400 bg-yellow-50/80'
                      : hl.color === 'green' ? 'border-green-400 bg-green-50/80'
                      : 'border-blue-400 bg-blue-50/80'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium line-clamp-2 flex-1 leading-relaxed">&ldquo;{hl.text}&rdquo;</p>
                    <div className="flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/60"
                        onClick={() => handleStartEdit(hl.id, hl.note)} title="Thêm/sửa ghi chú">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-500"
                        onClick={() => removeHighlight(hl.id)} title="Xóa highlight">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {editingHighlightId === hl.id ? (
                    <div className="flex gap-2 mt-3">
                      <Input value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Nhập ghi chú..." className="h-8 text-sm" autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNote(hl.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => handleSaveNote(hl.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    hl.note && (
                      <p className="text-xs text-muted-foreground italic mt-2 bg-white/70 px-3 py-2 rounded-md border border-gray-100">
                        {hl.note}
                      </p>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Vocab section */}
          {vocabList.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-sm text-purple-700 mb-3 pt-4 border-t">
                <BookOpen className="h-4 w-4" />
                Từ vựng ({vocabList.length})
              </h3>
              <div className="space-y-2">
                {vocabList.map((vocab) => (
                  <div key={vocab.id} className="p-3 bg-purple-50/80 rounded-lg border border-purple-100 flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-purple-800">{vocab.word}</p>
                      {vocab.definition && (
                        <p className="text-xs text-muted-foreground mt-1">{vocab.definition}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:bg-red-50 hover:text-red-500"
                      onClick={() => removeVocab(vocab.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard shortcuts */}
          <div className="pt-4 border-t">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
              <Keyboard className="h-3.5 w-3.5" />
              Phím tắt
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono border text-[10px]">H</kbd>
                <span>Highlight</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono border text-[10px]">N</kbd>
                <span>Ghi chú</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono border text-[10px]">T</kbd>
                <span>Từ vựng</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
