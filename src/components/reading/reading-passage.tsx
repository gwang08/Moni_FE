'use client';

import { useReadingStore } from '@/store/reading-store';
import { useRef } from 'react';
import type { Highlight } from '@/types/reading.types';

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
      // Create highlight with note mode - will prompt for note
      const newId = `hl_${Date.now()}`;
      addHighlight({
        text,
        startOffset,
        endOffset: startOffset + text.length,
        color: 'yellow',
      });
      // Open note editor for the new highlight
      setTimeout(() => setEditingHighlightId(newId), 50);
      selected.removeAllRanges();
    } else if (activeTool === 'vocab') {
      // Add word to vocab list
      addVocab({
        word: text,
      });
      selected.removeAllRanges();
    }
  };

  const handleHighlightClick = (hl: Highlight) => {
    if (activeTool === 'note') {
      setEditingHighlightId(hl.id);
    }
  };

  const renderHighlightedText = () => {
    if (highlights.length === 0) return content;

    const parts: Array<{ text: string; highlight?: Highlight }> = [];
    let lastIndex = 0;

    const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);

    // Handle overlapping highlights by taking the first one
    const nonOverlapping: Highlight[] = [];
    sorted.forEach((hl) => {
      const overlaps = nonOverlapping.some(
        (existing) => hl.startOffset < existing.endOffset && hl.endOffset > existing.startOffset
      );
      if (!overlaps) {
        nonOverlapping.push(hl);
      }
    });

    nonOverlapping.forEach((hl) => {
      if (hl.startOffset > lastIndex) {
        parts.push({ text: content.slice(lastIndex, hl.startOffset) });
      }
      parts.push({ text: content.slice(hl.startOffset, hl.endOffset), highlight: hl });
      lastIndex = hl.endOffset;
    });

    if (lastIndex < content.length) {
      parts.push({ text: content.slice(lastIndex) });
    }

    return parts.map((part, idx) =>
      part.highlight ? (
        <mark
          key={idx}
          onClick={() => handleHighlightClick(part.highlight!)}
          className={`cursor-pointer transition-all ${
            part.highlight.color === 'yellow'
              ? 'bg-yellow-200 hover:bg-yellow-300'
              : part.highlight.color === 'green'
              ? 'bg-green-200 hover:bg-green-300'
              : 'bg-blue-200 hover:bg-blue-300'
          } ${activeTool === 'note' ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
          title={part.highlight.note ? `Ghi chú: ${part.highlight.note}` : 'Click để thêm ghi chú'}
        >
          {part.text}
        </mark>
      ) : (
        <span key={idx}>{part.text}</span>
      )
    );
  };

  return (
    <div
      ref={passageRef}
      onMouseUp={handleMouseUp}
      className={`prose max-w-none p-6 bg-white rounded-lg select-text whitespace-pre-wrap leading-relaxed text-lg ${
        activeTool ? 'cursor-text' : ''
      }`}
    >
      {renderHighlightedText()}
    </div>
  );
}
