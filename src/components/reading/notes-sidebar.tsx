'use client';

import { useReadingStore } from '@/store/reading-store';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function NotesSidebar() {
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
    <div className="w-80 bg-white border-l p-4 overflow-y-auto flex flex-col">
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
                <p className="text-sm font-medium line-clamp-2 flex-1">{hl.text}</p>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleStartEdit(hl.id, hl.note)}
                    title="Thêm/sửa ghi chú"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeHighlight(hl.id)}
                    title="Xóa highlight"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {editingHighlightId === hl.id ? (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Nhập ghi chú..."
                    className="h-8 text-sm"
                    autoFocus
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
                  <p className="text-xs text-muted-foreground italic mt-1 bg-white/50 p-2 rounded">
                    {hl.note}
                  </p>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vocabulary section */}
      {vocabList.length > 0 && (
        <>
          <h3 className="font-bold mt-6 mb-4 pt-4 border-t">Từ vựng</h3>
          <div className="space-y-2">
            {vocabList.map((vocab) => (
              <div key={vocab.id} className="p-3 bg-purple-50 rounded border border-purple-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-purple-800">{vocab.word}</p>
                    {vocab.definition && (
                      <p className="text-sm text-muted-foreground mt-1">{vocab.definition}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => removeVocab(vocab.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tips */}
      <div className="mt-auto pt-4 border-t text-xs text-muted-foreground">
        <p className="font-medium mb-1">Phím tắt:</p>
        <p>H - Highlight</p>
        <p>N - Ghi chú</p>
        <p>T - Từ vựng (chế độ luyện tập)</p>
      </div>
    </div>
  );
}
