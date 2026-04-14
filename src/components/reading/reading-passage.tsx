'use client';

import { forwardRef, useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useReadingStore } from '@/store/reading-store';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { HighlightMark, NoteIconNode, MatchingSlotNode } from '@/components/reading/tiptap-highlight-extensions';
import { VocabPopup } from '@/components/reading/vocab-popup';
import { ReadingWordLookupPopup } from '@/components/reading/reading-word-lookup-popup';
import { SentenceTranslationPopup } from '@/components/reading/sentence-translation-popup';
import { NoteInlineEditor } from '@/components/reading/note-inline-editor';
import { HighlightContextMenu } from '@/components/reading/highlight-context-menu';
import { useWordSelection } from '@/hooks/use-word-selection';
import { formatReadingPassage } from '@/lib/format-reading-passage';
import { injectHighlights } from '@/lib/inject-highlights';

/** Get the word at a given (x, y) screen position using caretRangeFromPoint */
function getWordAtPoint(x: number, y: number): { word: string; node: Node; range: Range } | null {
  const range = document.caretRangeFromPoint?.(x, y);
  if (!range) return null;
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return null;
  const text = node.textContent || '';
  const offset = range.startOffset;
  let start = offset, end = offset;
  while (start > 0 && /\w/.test(text[start - 1])) start--;
  while (end < text.length && /\w/.test(text[end])) end++;
  const word = text.slice(start, end).trim();
  if (!word) return null;
  const wordRange = document.createRange();
  wordRange.setStart(node, start);
  wordRange.setEnd(node, end);
  return { word, node, range: wordRange };
}

/** TipTap extensions for read-only passage rendering (selection handled by ProseMirror) */
const PASSAGE_EXTENSIONS = [
  StarterKit.configure({ heading: false }),
  HighlightMark,
  NoteIconNode,
  MatchingSlotNode,
];

interface Props {
  content: string;
  interactive?: boolean;
  examMode?: boolean;
}

export const ReadingPassage = forwardRef<HTMLDivElement, Props>(function ReadingPassage(
  { content, interactive = true, examMode = false }: Props,
  forwardedRef
) {
  const {
    activeTool, selectedColor, addHighlight, highlights, addVocab,
    editingHighlightId, setEditingHighlightId, addNote, removeHighlight,
  } = useReadingStore();
  const passageRef = useRef<HTMLDivElement>(null);
  const [vocabPopup, setVocabPopup] = useState<{ word: string; sentence: string; x: number; y: number } | null>(null);
  const [notePopup, setNotePopup] = useState<{ id: string; note: string; x: number; y: number } | null>(null);
  const { selectedWord, position: wordSelPos, handleMouseUp: handleWordSelection, close: closeWordLookup } = useWordSelection();
  const [contextMenu, setContextMenu] = useState<{ type: 'highlight' | 'note'; hlId: string; x: number; y: number } | null>(null);
  const [translateButton, setTranslateButton] = useState<{ text: string; x: number; y: number } | null>(null);
  const [translatePopup, setTranslatePopup] = useState<{ text: string; x: number; y: number } | null>(null);
  const hoveredWordRef = useRef<{ el: HTMLElement | null }>({ el: null });
  const setPassageRef = useCallback((node: HTMLDivElement | null) => {
    passageRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  }, [forwardedRef]);

  // Build HTML with highlights injected
  const formattedContent = useMemo(() => formatReadingPassage(content), [content]);
  const renderedHtml = useMemo(() => injectHighlights(formattedContent, highlights), [formattedContent, highlights]);

  // TipTap editor in read-only mode — gives us ProseMirror's smooth selection
  const editor = useEditor({
    extensions: PASSAGE_EXTENSIONS,
    content: renderedHtml,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `max-w-none leading-relaxed ${
          examMode ? 'p-0 bg-transparent rounded-none text-[13px] leading-6' : 'p-6 bg-white rounded-lg text-lg'
        } ${interactive && activeTool && activeTool !== 'vocab' ? 'cursor-text' : ''} ${
          interactive && activeTool === 'vocab' ? 'vocab-mode' : ''
        }`,
      },
    },
  });

  // Update editor content when highlights change
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(renderedHtml);
    }
  }, [editor, renderedHtml]);

  useEffect(() => () => { editor?.destroy(); }, [editor]);

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

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!interactive) return;
    if (activeTool === 'vocab') return;
    const selected = window.getSelection();
    if (!selected || selected.toString().trim() === '') {
      if (!activeTool) setTranslateButton(null);
      return;
    }

    const text = selected.toString().trim();
    const range = selected.getRangeAt(0);

    // Ensure selection is within the editor
    const editorEl = passageRef.current?.querySelector('.tiptap') || passageRef.current;
    if (!editorEl || !editorEl.contains(range.commonAncestorContainer)) return;

    if (!activeTool) {
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      if (wordCount === 1 && text.length >= 2) {
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

    // Calculate offset for highlight/note
    const tiptapEl = passageRef.current?.querySelector('.tiptap');
    if (!tiptapEl) return;
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(tiptapEl);
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

  // Vocab mode: underline word on hover
  const clearHoveredWord = useCallback(() => {
    const span = hoveredWordRef.current.el;
    if (!span) return;
    const parent = span.parentNode;
    if (parent) {
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
      parent.normalize();
    }
    hoveredWordRef.current.el = null;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!interactive || activeTool !== 'vocab') return;
    clearHoveredWord();
    const result = getWordAtPoint(e.clientX, e.clientY);
    if (!result) return;
    const editorEl = passageRef.current?.querySelector('.tiptap');
    if (!editorEl?.contains(result.node)) return;
    if (result.node.parentElement?.closest('[data-note-id]')) return;
    try {
      const tempSpan = document.createElement('span');
      tempSpan.style.textDecoration = 'underline';
      tempSpan.style.textDecorationColor = '#3b82f6';
      tempSpan.style.textUnderlineOffset = '2px';
      result.range.surroundContents(tempSpan);
      hoveredWordRef.current.el = tempSpan;
    } catch { /* ignore */ }
  }, [activeTool, clearHoveredWord, interactive]);

  const handleMouseOver = (e: React.MouseEvent) => {
    if (!interactive) return;
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
    if (!interactive) return;
    const target = e.relatedTarget as HTMLElement | null;
    if (!target?.closest?.('[data-note-id]')) setNotePopup(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    if (!activeTool) {
      const sel = window.getSelection();
      if (!sel || sel.toString().trim().length === 0) {
        setTranslateButton(null);
        setTranslatePopup(null);
        closeWordLookup();
      }
    }

    if (activeTool === 'vocab') {
      clearHoveredWord();
      const result = getWordAtPoint(e.clientX, e.clientY);
      const editorEl = passageRef.current?.querySelector('.tiptap');
      if (result && editorEl?.contains(result.node)) {
        const sentence = getSentenceAroundWord(result.node, result.word);
        const rect = result.range.getBoundingClientRect();
        setVocabPopup({ word: result.word, sentence, x: rect.left, y: rect.bottom });
        addVocab({ word: result.word });
      }
      return;
    }

    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) return;

    const target = e.target as HTMLElement;
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

    const mark = target.closest('mark[data-hl-id]') as HTMLElement;
    if (mark) {
      const hlId = mark.getAttribute('data-hl-id');
      if (hlId) {
        const rect = mark.getBoundingClientRect();
        setContextMenu({ type: 'highlight', hlId, x: rect.left, y: rect.bottom });
      }
    }
  };

  const editingHighlight = editingHighlightId ? highlights.find(h => h.id === editingHighlightId) : null;

  return (
    <>
      <div
        ref={setPassageRef}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onMouseMove={handleMouseMove}
        onMouseLeave={activeTool === 'vocab' ? clearHoveredWord : undefined}
        style={activeTool === 'vocab' ? { userSelect: 'none', WebkitUserSelect: 'none' } : undefined}
      >
        <EditorContent editor={editor} />
      </div>

      {interactive && vocabPopup && (
        <VocabPopup word={vocabPopup.word} sentence={vocabPopup.sentence} position={{ x: vocabPopup.x, y: vocabPopup.y }} onClose={() => setVocabPopup(null)} />
      )}

      {interactive && selectedWord && wordSelPos && !activeTool && (
        <ReadingWordLookupPopup word={selectedWord} position={wordSelPos} onClose={closeWordLookup} />
      )}

      {interactive && translateButton && !translatePopup && (
        <div style={{ position: 'fixed', left: translateButton.x, top: translateButton.y - 36, transform: 'translateX(-50%)', zIndex: 50 }}>
          <button
            onMouseDown={(e) => {
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

      {interactive && translatePopup && (
        <SentenceTranslationPopup text={translatePopup.text} position={{ x: translatePopup.x - 200, y: translatePopup.y }} onClose={() => setTranslatePopup(null)} />
      )}

      {interactive && notePopup && (
        <NoteInlineEditor mode="view" note={notePopup.note} position={{ x: notePopup.x, y: notePopup.y }} onClose={() => setNotePopup(null)} />
      )}

      {interactive && editingHighlightId && (
        <NoteInlineEditorFromDom
          highlightId={editingHighlightId}
          currentNote={editingHighlight?.note}
          onSave={(note) => { addNote(editingHighlightId, note); setEditingHighlightId(null); }}
          onCancel={() => setEditingHighlightId(null)}
        />
      )}

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

      {interactive && activeTool === 'vocab' && (
        <style dangerouslySetInnerHTML={{ __html: `.vocab-mode { cursor: default !important; }` }} />
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .matching-slot {
          position: relative;
          display: inline-flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
          max-width: 100%;
          margin-right: 0;
          margin-bottom: 6px;
          vertical-align: top;
          user-select: none;
          -webkit-user-select: none;
        }
        .matching-slot-badge {
          flex: 0 0 auto;
          min-width: 22px;
          height: 22px;
          border-radius: 9999px;
          border: 1px solid #d1d5db;
          background: #fff;
          color: #374151;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          line-height: 1;
          font-weight: 800;
          padding: 0 5px;
          margin-top: 8px;
        }
        .matching-slot-body {
          position: relative;
          flex: 1 1 auto;
          min-width: 0;
          border: 2px dashed #d1d5db;
          border-radius: 10px;
          background: #fff;
          padding: 8px 10px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .matching-slot-answer {
          display: block;
          min-height: 18px;
          padding-right: 20px;
          font-size: 12px;
          line-height: 1.25;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .matching-slot[data-state="active"] .matching-slot-body {
          border-color: #93c5fd;
          background: #eff6ff;
        }
        .matching-slot[data-state="filled"] .matching-slot-body {
          border-color: #bfdbfe;
          background: #eff6ff;
        }
        .matching-slot[data-state="submitted-correct"] .matching-slot-body {
          border-color: #a7f3d0;
          background: #ecfdf5;
          color: #047857;
        }
        .matching-slot[data-state="submitted-wrong"] .matching-slot-body {
          border-color: #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }
        .matching-slot[data-state="empty"] .matching-slot-answer {
          color: #9ca3af;
        }
        .matching-slot [data-clear-matching-answer] {
          position: absolute;
          right: 8px;
          top: 8px;
          width: 14px;
          height: 14px;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }
        .matching-slot [data-clear-matching-answer]::before {
          content: "×";
          display: block;
          font-size: 12px;
          line-height: 14px;
          color: #9ca3af;
          text-align: center;
        }
        .matching-slot:hover [data-clear-matching-answer]::before {
          color: #374151;
        }
      ` }} />
    </>
  );
});

function NoteInlineEditorFromDom({ highlightId, currentNote, onSave, onCancel }: {
  highlightId: string; currentNote?: string; onSave: (note: string) => void; onCancel: () => void;
}) {
  const el = typeof document !== 'undefined' ? document.querySelector(`mark[data-hl-id="${highlightId}"]`) : null;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return <NoteInlineEditor mode="edit" note={currentNote || ''} position={{ x: rect.left, y: rect.bottom }} onSave={onSave} onClose={onCancel} />;
}
