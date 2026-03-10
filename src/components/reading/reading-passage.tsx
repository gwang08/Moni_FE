'use client';

import { useReadingStore } from '@/store/reading-store';
import { useRef, useMemo } from 'react';

const COLOR_CLASSES: Record<string, string> = {
  yellow: 'background-color: #fef08a',
  green: 'background-color: #bbf7d0',
  blue: 'background-color: #bfdbfe',
};

function injectHighlights(html: string, highlights: { text: string; color: string; id: string }[]): string {
  if (!highlights.length) return html;
  let result = html;
  for (const hl of highlights) {
    const escaped = hl.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(
      new RegExp(`(${escaped})`, 'i'),
      `<mark data-hl-id="${hl.id}" style="${COLOR_CLASSES[hl.color] || COLOR_CLASSES.yellow}; border-radius: 2px; padding: 0 2px; cursor: pointer;">$1</mark>`
    );
  }
  return result;
}

interface Props {
  content: string;
  onOpenNotes?: () => void;
}

export function ReadingPassage({ content, onOpenNotes }: Props) {
  const {
    activeTool,
    selectedColor,
    addHighlight,
    highlights,
    addVocab,
    setEditingHighlightId,
  } = useReadingStore();
  const passageRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
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
      addHighlight({
        text,
        startOffset,
        endOffset: startOffset + text.length,
        color: selectedColor,
      });
      selected.removeAllRanges();
    } else if (activeTool === 'note') {
      const newId = `hl_${Date.now()}`;
      addHighlight({
        text,
        startOffset,
        endOffset: startOffset + text.length,
        color: 'yellow',
      });
      onOpenNotes?.();
      setTimeout(() => setEditingHighlightId(newId), 50);
      selected.removeAllRanges();
    } else if (activeTool === 'vocab') {
      addVocab({ word: text });
      selected.removeAllRanges();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const mark = target.closest('mark[data-hl-id]');
    if (mark && activeTool === 'note') {
      setEditingHighlightId(mark.getAttribute('data-hl-id'));
    }
  };

  const renderedHtml = useMemo(() =>
    injectHighlights(content, highlights),
  [content, highlights]);

  return (
    <div
      ref={passageRef}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      className={`prose max-w-none p-6 bg-white rounded-lg select-text leading-relaxed text-lg ${
        activeTool ? 'cursor-text' : ''
      }`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
