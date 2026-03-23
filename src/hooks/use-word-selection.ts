'use client';

import { useState, useCallback } from 'react';

interface WordSelection {
  selectedWord: string | null;
  position: { x: number; y: number } | null;
  handleMouseUp: (e: React.MouseEvent) => void;
  close: () => void;
}

export function useWordSelection(): WordSelection {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length >= 2 && !text.includes(' ')) {
      setSelectedWord(text.toLowerCase());
      setPosition({ x: e.clientX, y: e.clientY });
    } else {
      setSelectedWord(null);
      setPosition(null);
    }
  }, []);

  const close = useCallback(() => {
    setSelectedWord(null);
    setPosition(null);
  }, []);

  return { selectedWord, position, handleMouseUp, close };
}
