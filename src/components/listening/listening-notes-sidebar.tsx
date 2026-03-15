'use client';

import { useState } from 'react';
import { Trash2, StickyNote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useListeningStore } from '@/store/listening-store';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function ListeningNotesSidebar({ open, onOpenChange }: Props) {
  const { notes, addNoteAtCurrentTime, removeNote, seekTo, currentTime } = useListeningStore();
  const [noteInput, setNoteInput] = useState('');

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    addNoteAtCurrentTime(noteInput.trim());
    setNoteInput('');
  };

  const sortedNotes = [...notes].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        showOverlay={false}
        className="w-80 sm:w-96 overflow-y-auto border-l shadow-2xl p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b bg-gradient-to-r from-violet-50 to-indigo-50">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="h-5 w-5 text-violet-600" />
            Ghi chú
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {notes.length} ghi chú · Đang ở {formatTimestamp(currentTime)}
          </p>
        </SheetHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Add note input */}
          <div className="flex gap-2">
            <Input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder={`Ghi chú tại ${formatTimestamp(currentTime)}...`}
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddNote();
              }}
            />
            <Button size="icon" className="shrink-0" onClick={handleAddNote} disabled={!noteInput.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Notes list */}
          {sortedNotes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Chưa có ghi chú nào.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Nhập ghi chú và bấm Enter để lưu tại thời điểm hiện tại
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => seekTo(note.timestamp)}
                  className="p-3 rounded-lg border border-violet-100 bg-violet-50/50 cursor-pointer hover:bg-violet-100/70 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded">
                      {formatTimestamp(note.timestamp)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNote(note.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
