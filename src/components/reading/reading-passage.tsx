'use client';

import { useReadingStore } from '@/store/reading-store';
import { useRef, useMemo, useState, useCallback } from 'react';
import { VocabPopup } from '@/components/reading/vocab-popup';
import { ReadingWordLookupPopup } from '@/components/reading/reading-word-lookup-popup';
import { SentenceTranslationPopup } from '@/components/reading/sentence-translation-popup';
import { NoteInlineEditor } from '@/components/reading/note-inline-editor';
import { HighlightContextMenu } from '@/components/reading/highlight-context-menu';
import { useWordSelection } from '@/hooks/use-word-selection';
import type { Highlight } from '@/types/reading.types';
import { formatReadingPassage } from '@/lib/format-reading-passage';

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

/** Build a mapping from plain-text offset → HTML string index, skipping tags & decoding entities */
function buildTextToHtmlMap(html: string): number[] {
  const map: number[] = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) break;
      i = end + 1;
      continue;
    }
    if (html[i] === '&') {
      const semi = html.indexOf(';', i);
      if (semi !== -1 && semi - i < 10) {
        map.push(i);
        i = semi + 1;
        continue;
      }
    }
    map.push(i);
    i++;
  }
  map.push(html.length); // sentinel for end-of-text
  return map;
}

const NOTE_ICON_SVG =
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

function injectHighlights(html: string, highlights: Highlight[]): string {
  if (!highlights.length) return html;

  const map = buildTextToHtmlMap(html);
  // Sort descending by startOffset so later inserts don't shift earlier positions
  const sorted = [...highlights].sort((a, b) => b.startOffset - a.startOffset);
  let result = html;

  for (const hl of sorted) {
    const start = map[hl.startOffset];
    const end = map[hl.endOffset];
    if (start === undefined || end === undefined || start >= end) continue;

    const noteIcon = hl.note
      ? `<span data-note-id="${hl.id}" class="note-icon" style="display:inline-block;margin-left:2px;cursor:pointer;vertical-align:middle;">${NOTE_ICON_SVG}</span>`
      : '';
    const style = COLOR_CLASSES[hl.color] || COLOR_CLASSES.yellow;
    const openTag = `<mark data-hl-id="${hl.id}" style="${style}; border-radius: 2px; padding: 0 2px; cursor: pointer;">`;

    result = result.slice(0, start) + openTag + result.slice(start, end) + '</mark>' + noteIcon + result.slice(end);
  }

  return result;
}

interface Props {
  content: string;
  interactive?: boolean;
  examMode?: boolean;
}

export function ReadingPassage({ content, interactive = true, examMode = false }: Props) {
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
  const { selectedWord, position: wordSelPos, handleMouseUp: handleWordSelection, close: closeWordLookup } = useWordSelection();
  const [contextMenu, setContextMenu] = useState<{ type: 'highlight' | 'note'; hlId: string; x: number; y: number } | null>(null);
  // Sentence translation: button anchor + popup state
  const [translateButton, setTranslateButton] = useState<{ text: string; x: number; y: number } | null>(null);
  const [translatePopup, setTranslatePopup] = useState<{ text: string; x: number; y: number } | null>(null);
  const hoveredWordRef = useRef<{ el: HTMLElement | null }>({ el: null });
  const isDraggingRef = useRef(false);
  const selStartRef = useRef<{ node: Node; offset: number } | null>(null);

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

  /** Custom selection: record precise start caret on mousedown */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    if (activeTool === 'vocab') return;
    const caret = document.caretRangeFromPoint(e.clientX, e.clientY);
    selStartRef.current = caret ? { node: caret.startContainer, offset: caret.startOffset } : null;
  }, [activeTool]);

  /** Custom selection: use setBaseAndExtent for precise forward + backward selection */
  const handleDragSelect = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !selStartRef.current || activeTool === 'vocab') return;
    if (!passageRef.current?.contains(e.target as Node)) return;
    const end = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!end) return;
    try {
      const s = selStartRef.current;
      window.getSelection()?.setBaseAndExtent(s.node, s.offset, end.startContainer, end.startOffset);
    } catch { /* ignore invalid ranges */ }
  }, [activeTool]);

  const handleMouseUp = (e: React.MouseEvent) => {
    isDraggingRef.current = false;
    if (!interactive) return;
    if (activeTool === 'vocab') return; // vocab uses click, not drag
    const selected = window.getSelection();
    if (!selected || selected.toString().trim() === '') {
      // If clicking without selection and no active tool, dismiss translate button
      if (!activeTool) setTranslateButton(null);
      return;
    }

    const text = selected.toString().trim();
    const range = selected.getRangeAt(0);

    if (!passageRef.current || !passageRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    // When no tool active: single word → lookup popup; multiple words → "Dịch câu" button
    if (!activeTool) {
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      if (wordCount === 1 && text.length >= 2) {
        // Single word selected — show inline lookup popup
        handleWordSelection(e);
        setTranslateButton(null);
      } else if (wordCount >= 2) {
        closeWordLookup();
        const rect = range.getBoundingClientRect();
        setTranslateButton({ text, x: rect.left + rect.width / 2, y: rect.top });
        setTranslatePopup(null);
      }
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
      const hlId = `hl_${Date.now()}`;
      addHighlight({ id: hlId, text, startOffset, endOffset: startOffset + text.length, color: 'yellow' });
      setEditingHighlightId(hlId);
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
    if (!interactive) return;
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
  }, [activeTool, clearHoveredWord, interactive]);

  const handleMouseOver = (e: React.MouseEvent) => {
    if (!interactive || isDraggingRef.current) return;
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
    if (!interactive || isDraggingRef.current) return;
    const target = e.relatedTarget as HTMLElement | null;
    if (!target?.closest?.('[data-note-id]')) {
      setNotePopup(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    // Dismiss sentence translation state on any click (unless it's the translate button itself)
    if (!activeTool) {
      const sel = window.getSelection();
      if (!sel || sel.toString().trim().length === 0) {
        setTranslateButton(null);
        setTranslatePopup(null);
        closeWordLookup();
      }
    }

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

  const formattedContent = useMemo(() => formatReadingPassage(content), [content]);
  const renderedHtml = useMemo(() =>
    injectHighlights(formattedContent, highlights),
  [formattedContent, highlights]);

  // Find the editing highlight for inline editor position
  const editingHighlight = editingHighlightId ? highlights.find(h => h.id === editingHighlightId) : null;

  return (
    <>
      <div
        ref={passageRef}
        onMouseDown={handleMouseDown}
        onMouseUp={(e) => handleMouseUp(e)}
        onClick={handleClick}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onMouseMove={activeTool === 'vocab' ? handleMouseMove : handleDragSelect}
        {...(activeTool === 'vocab' ? { onMouseLeave: clearHoveredWord } : {})}
        className={`max-w-none leading-relaxed ${
          examMode
            ? 'p-0 bg-transparent rounded-none text-[13px] leading-6'
            : 'p-6 bg-white rounded-lg text-lg'
        } ${
          !interactive
            ? ''
            : activeTool === 'vocab'
              ? 'vocab-mode'
              : ''
        } ${interactive && activeTool && activeTool !== 'vocab' ? 'cursor-text' : ''}`}
        style={{ userSelect: activeTool === 'vocab' ? 'none' : 'text', WebkitUserSelect: activeTool === 'vocab' ? 'none' : 'text' }}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />

      {/* Vocab popup (toolbar vocab mode) */}
      {interactive && vocabPopup && (
        <VocabPopup
          word={vocabPopup.word}
          sentence={vocabPopup.sentence}
          position={{ x: vocabPopup.x, y: vocabPopup.y }}
          onClose={() => setVocabPopup(null)}
        />
      )}

      {/* Inline word lookup popup (no-tool, single-word selection) */}
      {interactive && selectedWord && wordSelPos && !activeTool && (
        <ReadingWordLookupPopup
          word={selectedWord}
          position={wordSelPos}
          onClose={closeWordLookup}
        />
      )}

      {/* Floating "Dịch câu" button after text selection (no tool active) */}
      {interactive && translateButton && !translatePopup && (
        <div
          style={{
            position: 'fixed',
            left: translateButton.x,
            top: translateButton.y - 36,
            transform: 'translateX(-50%)',
            zIndex: 50,
          }}
        >
          <button
            onMouseDown={(e) => {
              // Use mouseDown to fire before selection is cleared by click
              e.preventDefault();
              e.stopPropagation();
              setTranslatePopup({ text: translateButton.text, x: translateButton.x, y: translateButton.y });
              setTranslateButton(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-full shadow-lg transition-colors whitespace-nowrap"
          >
            Dịch câu
          </button>
        </div>
      )}

      {/* Sentence translation popup */}
      {interactive && translatePopup && (
        <SentenceTranslationPopup
          text={translatePopup.text}
          position={{ x: translatePopup.x - 200, y: translatePopup.y }}
          onClose={() => setTranslatePopup(null)}
        />
      )}

      {/* Note tooltip on hover icon */}
      {interactive && notePopup && (
        <NoteInlineEditor
          mode="view"
          note={notePopup.note}
          position={{ x: notePopup.x, y: notePopup.y }}
          onClose={() => setNotePopup(null)}
        />
      )}

      {/* Note inline editor */}
      {interactive && editingHighlightId && (
        <NoteInlineEditorFromDom
          highlightId={editingHighlightId}
          currentNote={editingHighlight?.note}
          onSave={(note) => { addNote(editingHighlightId, note); setEditingHighlightId(null); }}
          onCancel={() => setEditingHighlightId(null)}
        />
      )}

      {/* Context menu for highlight/note */}
      {interactive && contextMenu && (
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
      {interactive && activeTool === 'vocab' && (
        <style dangerouslySetInnerHTML={{ __html: `
          .vocab-mode { cursor: default !important; }
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
