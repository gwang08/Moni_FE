'use client';

import { useReadingStore } from '@/store/reading-store';
import { useRef } from 'react';
import type { Highlight } from '@/types/reading.types';

interface Props {
  content: string;
}

export function ReadingPassage({ content }: Props) {
  const { activeTool, selectedColor, addHighlight, highlights } = useReadingStore();
  const passageRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const selected = window.getSelection();
    if (!selected || selected.toString().trim() === '') return;
    if (activeTool !== 'highlight') return;

    const text = selected.toString();
    const range = selected.getRangeAt(0);

    if (passageRef.current && passageRef.current.contains(range.commonAncestorContainer)) {
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(passageRef.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preSelectionRange.toString().length;

      addHighlight({
        text,
        startOffset,
        endOffset: startOffset + text.length,
        color: selectedColor,
      });

      selected.removeAllRanges();
    }
  };

  const renderHighlightedText = () => {
    if (highlights.length === 0) return content;

    const parts: Array<{ text: string; highlight?: Highlight }> = [];
    let lastIndex = 0;

    const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);

    sorted.forEach((hl) => {
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
          className={`cursor-pointer ${
            part.highlight.color === 'yellow'
              ? 'bg-yellow-200'
              : part.highlight.color === 'green'
              ? 'bg-green-200'
              : 'bg-blue-200'
          }`}
          title={part.highlight.note || ''}
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
      className={`prose max-w-none p-6 bg-white rounded-lg select-text whitespace-pre-wrap ${
        activeTool ? 'cursor-text' : ''
      }`}
    >
      {renderHighlightedText()}
    </div>
  );
}
