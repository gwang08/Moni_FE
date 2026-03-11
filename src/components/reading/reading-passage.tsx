'use client';

import { useReadingStore } from '@/store/reading-store';
import { useRef, useMemo, useState, useCallback } from 'react';
import { VocabPopup } from '@/components/reading/vocab-popup';
import { NoteInlineEditor } from '@/components/reading/note-inline-editor';
import { HighlightContextMenu } from '@/components/reading/highlight-context-menu';
import type { Highlight } from '@/types/reading.types';

/** Get the word at a given (x, y) screen position using caretRangeFromPoint */
function getWordAtPoint(x: number, y: number): { word: string; node: Node; range: Range } | null {
  let range: Range | null = null;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  }
  if (!range) return null;
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return null;
  const text = node.textContent || '';
  const offset = range.startOffset;
  // Expand to word boundaries
  let start = offset;
  let end = offset;
  while (start > 0 && /\w/.test(text[start - 1])) start--;
  while (end < text.length && /\w/.test(text[end])) end++;
  const word = text.slice(start, end).trim();
  if (!word) return null;
  const wordRange = document.createRange();
  wordRange.setStart(node, start);
  wordRange.setEnd(node, end);
  return { word, node, range: wordRange };
}

const COLOR_CLASSES: Record<string, string> = {
  yellow: 'background-color: #fef08a',
  green: 'background-color: #bbf7d0',
  blue: 'background-color: #bfdbfe',
};

function injectHighlights(html: string, highlights: Highlight[]): string {
  if (!highlights.length) return html;
  let result = html;
  for (const hl of highlights) {
    const escaped = hl.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const noteIcon = hl.note
      ? `<span data-note-id="${hl.id}" class="note-icon" style="display:inline-block;margin-left:2px;cursor:pointer;vertical-align:middle;">` +
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>`
      : '';
    result = result.replace(
      new RegExp(`(${escaped})`, 'i'),
      `<mark data-hl-id="${hl.id}" style="${COLOR_CLASSES[hl.color] || COLOR_CLASSES.yellow}; border-radius: 2px; padding: 0 2px; cursor: pointer;">$1</mark>${noteIcon}`
    );
  }
  return result;
}

interface Props {
  content: string;
}

export function ReadingPassage({ content }: Props) {
  const {
    activeTool,
    selectedColor,
    addHighlight,
    highlights,
    addVocab,
    editingHighlightId,
    setEditingHighlightId,
    addNote,
    removeHighlight,
  } = useReadingStore();
  const passageRef = useRef<HTMLDivElement>(null);
  const [vocabPopup, setVocabPopup] = useState<{ word: string; sentence: string; x: number; y: number } | null>(null);
  const [notePopup, setNotePopup] = useState<{ id: string; note: string; x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ type: 'highlight' | 'note'; hlId: string; x: number; y: number } | null>(null);
  const hoveredWordRef = useRef<{ el: HTMLElement | null }>({ el: null });

  const getSentenceAroundWord = useCallback((node: Node, word: string): string => {
    const parent = node.parentElement;
    if (!parent) return word;
    const text = parent.textContent || '';
    const wordIdx = text.toLowerCase().indexOf(word.toLowerCase());
    if (wordIdx === -1) return text.slice(0, 200);
    const before = text.lastIndexOf('.', wordIdx);
    const after = text.indexOf('.', wordIdx + word.length);
    const start = before >= 0 ? before + 1 : 0;
    const end = after >= 0 ? after + 1 : text.length;
    return text.slice(start, end).trim();
  }, []);

  const handleMouseUp = () => {
    if (activeTool === 'vocab') return; // vocab uses click, not drag
    const selected = window.getSelection();
    if (!selected || selected.toString().trim() === '') return;
    if (!activeTool) return;

    const text = selected.toString().trim();
    const range = selected.getRangeAt(0);

    if (!passageRef.current || !passageRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(passageRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preSelectionRange.toString().length;

    if (activeTool === 'highlight') {
      addHighlight({ text, startOffset, endOffset: startOffset + text.length, color: selectedColor });
      selected.removeAllRanges();
    } else if (activeTool === 'note') {
      addHighlight({ text, startOffset, endOffset: startOffset + text.length, color: 'yellow' });
      setTimeout(() => {
        const newHl = document.querySelector(`mark[data-hl-id]`) as HTMLElement;
        if (newHl) {
          setEditingHighlightId(newHl.getAttribute('data-hl-id'));
        }
      }, 50);
      selected.removeAllRanges();
    }
  };

  // Unwrap a temporary underline span, restoring original text node
  const clearHoveredWord = useCallback(() => {
    const span = hoveredWordRef.current.el;
    if (!span) return;
    const parent = span.parentNode;
    if (parent) {
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
      parent.normalize(); // merge adjacent text nodes
    }
    hoveredWordRef.current.el = null;
  }, []);

  // Vocab mode: underline word on hover
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'vocab') return;
    clearHoveredWord();
    const result = getWordAtPoint(e.clientX, e.clientY);
    if (!result || !passageRef.current?.contains(result.node)) return;
    const parent = result.node.parentElement;
    if (parent && parent.closest('[data-note-id]')) return;
    try {
      const tempSpan = document.createElement('span');
      tempSpan.style.textDecoration = 'underline';
      tempSpan.style.textDecorationColor = '#3b82f6';
      tempSpan.style.textUnderlineOffset = '2px';
      result.range.surroundContents(tempSpan);
      hoveredWordRef.current.el = tempSpan;
    } catch {
      // surroundContents can fail if range crosses element boundaries — ignore
    }
  }, [activeTool, clearHoveredWord]);

  const handleMouseOver = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const noteIcon = target.closest('[data-note-id]') as HTMLElement;
    if (noteIcon) {
      const noteId = noteIcon.getAttribute('data-note-id');
      const hl = highlights.find(h => h.id === noteId);
      if (hl?.note) {
        const rect = noteIcon.getBoundingClientRect();
        setNotePopup({ id: hl.id, note: hl.note, x: rect.left, y: rect.bottom });
      }
    }
  };

  const handleMouseOut = (e: React.MouseEvent) => {
    const target = e.relatedTarget as HTMLElement | null;
    if (!target?.closest?.('[data-note-id]')) {
      setNotePopup(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Vocab mode: single-word click lookup
    if (activeTool === 'vocab') {
      // Clean up underline span first
      clearHoveredWord();
      const result = getWordAtPoint(e.clientX, e.clientY);
      if (result && passageRef.current?.contains(result.node)) {
        const sentence = getSentenceAroundWord(result.node, result.word);
        const rect = result.range.getBoundingClientRect();
        setVocabPopup({ word: result.word, sentence, x: rect.left, y: rect.bottom });
        addVocab({ word: result.word });
      }
      return;
    }

    // Don't show menu if user just finished selecting text
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) return;

    const target = e.target as HTMLElement;

    // Click on note icon → context menu to delete note (which removes highlight too)
    const noteIcon = target.closest('[data-note-id]') as HTMLElement;
    if (noteIcon) {
      const noteId = noteIcon.getAttribute('data-note-id');
      if (noteId) {
        const rect = noteIcon.getBoundingClientRect();
        setContextMenu({ type: 'note', hlId: noteId, x: rect.right, y: rect.bottom });
        setNotePopup(null);
      }
      return;
    }

    // Click on highlight → context menu (delete highlight / add note)
    const mark = target.closest('mark[data-hl-id]') as HTMLElement;
    if (mark) {
      const hlId = mark.getAttribute('data-hl-id');
      if (hlId) {
        const rect = mark.getBoundingClientRect();
        setContextMenu({ type: 'highlight', hlId, x: rect.left, y: rect.bottom });
      }
    }
  };

  const renderedHtml = useMemo(() =>
    injectHighlights(content, highlights),
  [content, highlights]);

  // Find the editing highlight for inline editor position
  const editingHighlight = editingHighlightId ? highlights.find(h => h.id === editingHighlightId) : null;

  return (
    <>
      <div
        ref={passageRef}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onMouseMove={handleMouseMove}
        onMouseLeave={clearHoveredWord}
        className={`prose max-w-none p-6 bg-white rounded-lg leading-relaxed text-lg ${
          activeTool === 'vocab' ? 'vocab-mode select-none' : 'select-text'
        } ${activeTool && activeTool !== 'vocab' ? 'cursor-text' : ''}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />

      {/* Vocab popup */}
      {vocabPopup && (
        <VocabPopup
          word={vocabPopup.word}
          sentence={vocabPopup.sentence}
          position={{ x: vocabPopup.x, y: vocabPopup.y }}
          onClose={() => setVocabPopup(null)}
        />
      )}

      {/* Note tooltip on hover icon */}
      {notePopup && (
        <NoteInlineEditor
          mode="view"
          note={notePopup.note}
          position={{ x: notePopup.x, y: notePopup.y }}
          onClose={() => setNotePopup(null)}
        />
      )}

      {/* Note inline editor */}
      {editingHighlightId && (
        <NoteInlineEditorFromDom
          highlightId={editingHighlightId}
          currentNote={editingHighlight?.note}
          onSave={(note) => { addNote(editingHighlightId, note); setEditingHighlightId(null); }}
          onCancel={() => setEditingHighlightId(null)}
        />
      )}

      {/* Context menu for highlight/note */}
      {contextMenu && (
        <HighlightContextMenu
          type={contextMenu.type}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onAddNote={() => setEditingHighlightId(contextMenu.hlId)}
          onDeleteHighlight={() => removeHighlight(contextMenu.hlId)}
          onDeleteNote={() => removeHighlight(contextMenu.hlId)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* CSS for vocab mode: default cursor, no text selection */}
      {activeTool === 'vocab' && (
        <style dangerouslySetInnerHTML={{ __html: `
          .vocab-mode { cursor: default !important; user-select: none !important; }
        `}} />
      )}
    </>
  );
}

/** Positions note editor near the DOM highlight element */
function NoteInlineEditorFromDom({ highlightId, currentNote, onSave, onCancel }: {
  highlightId: string;
  currentNote?: string;
  onSave: (note: string) => void;
  onCancel: () => void;
}) {
  const el = typeof document !== 'undefined' ? document.querySelector(`mark[data-hl-id="${highlightId}"]`) : null;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return (
    <NoteInlineEditor
      mode="edit"
      note={currentNote || ''}
      position={{ x: rect.left, y: rect.bottom }}
      onSave={onSave}
      onClose={onCancel}
    />
  );
}
