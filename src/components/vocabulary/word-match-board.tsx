'use client';

import { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import { WordMatchPair } from '@/types/vocab.types';

interface MatchItem {
  id: number; // index into pairs
  text: string;
  type: 'word' | 'definition';
  matched: boolean;
  flash: 'none' | 'correct' | 'wrong';
}

interface WordMatchBoardProps {
  pairs: WordMatchPair[];
  onComplete: (elapsedSeconds: number, moves: number) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function WordMatchBoard({ pairs, onComplete }: WordMatchBoardProps) {
  const [words, setWords] = useState<MatchItem[]>([]);
  const [definitions, setDefinitions] = useState<MatchItem[]>([]);
  const [selectedWord, setSelectedWord] = useState<MatchItem | null>(null);
  const [selectedDef, setSelectedDef] = useState<MatchItem | null>(null);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const wordItems: MatchItem[] = pairs.map((p, i) => ({
      id: i,
      text: p.word,
      type: 'word',
      matched: false,
      flash: 'none',
    }));
    const defItems: MatchItem[] = pairs.map((p, i) => ({
      id: i,
      text: p.definition || p.meaning || p.word,
      type: 'definition',
      matched: false,
      flash: 'none',
    }));
    setWords(shuffleArray(wordItems));
    setDefinitions(shuffleArray(defItems));
    startTime.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pairs]);

  // Process match when both are selected
  useEffect(() => {
    if (!selectedWord || !selectedDef) return;

    const isCorrect = selectedWord.id === selectedDef.id;
    setMoves((m) => m + 1);

    const flash = (type: 'word' | 'definition', id: number, kind: 'correct' | 'wrong') => {
      const setter = type === 'word' ? setWords : setDefinitions;
      setter((prev) =>
        prev.map((item) => (item.id === id ? { ...item, flash: kind } : item))
      );
    };

    if (isCorrect) {
      flash('word', selectedWord.id, 'correct');
      flash('definition', selectedDef.id, 'correct');
      setTimeout(() => {
        setWords((prev) =>
          prev.map((item) =>
            item.id === selectedWord.id ? { ...item, matched: true, flash: 'none' } : item
          )
        );
        setDefinitions((prev) =>
          prev.map((item) =>
            item.id === selectedDef.id ? { ...item, matched: true, flash: 'none' } : item
          )
        );
        setSelectedWord(null);
        setSelectedDef(null);
      }, 600);
    } else {
      flash('word', selectedWord.id, 'wrong');
      flash('definition', selectedDef.id, 'wrong');
      setTimeout(() => {
        setWords((prev) =>
          prev.map((item) => (item.id === selectedWord.id ? { ...item, flash: 'none' } : item))
        );
        setDefinitions((prev) =>
          prev.map((item) => (item.id === selectedDef.id ? { ...item, flash: 'none' } : item))
        );
        setSelectedWord(null);
        setSelectedDef(null);
      }, 600);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWord, selectedDef]);

  // Check completion
  useEffect(() => {
    if (words.length === 0) return;
    const allMatched = words.every((w) => w.matched);
    if (allMatched) {
      if (timerRef.current) clearInterval(timerRef.current);
      const total = Math.floor((Date.now() - startTime.current) / 1000);
      onComplete(total, moves);
    }
  }, [words, moves, onComplete]);

  const handleWordClick = (item: MatchItem) => {
    if (item.matched || item.flash !== 'none') return;
    if (selectedWord?.id === item.id) {
      setSelectedWord(null);
    } else {
      setSelectedWord(item);
    }
  };

  const handleDefClick = (item: MatchItem) => {
    if (item.matched || item.flash !== 'none') return;
    if (selectedDef?.id === item.id) {
      setSelectedDef(null);
    } else {
      setSelectedDef(item);
    }
  };

  const getItemStyle = (item: MatchItem, isSelected: boolean) => {
    if (item.matched) return 'border-green-300 bg-green-50 text-green-700 opacity-40 cursor-default';
    if (item.flash === 'correct') return 'border-green-400 bg-green-100 text-green-800 scale-105';
    if (item.flash === 'wrong') return 'border-red-400 bg-red-100 text-red-700 scale-95';
    if (isSelected) return 'border-purple-500 bg-purple-50 text-purple-800 shadow-md';
    return 'border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50 cursor-pointer';
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* Timer & moves */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Timer className="h-4 w-4" />
          <span className="font-mono font-semibold">{formatTime(elapsed)}</span>
        </div>
        <span className="text-sm text-gray-500">Lượt: {moves}</span>
        <span className="text-sm text-gray-500">
          {words.filter((w) => w.matched).length}/{words.length} đúng
        </span>
      </div>

      {/* Two-column board */}
      <div className="grid grid-cols-2 gap-3">
        {/* Words column */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Từ</p>
          {words.map((item) => (
            <button
              key={item.id}
              onClick={() => handleWordClick(item)}
              disabled={item.matched}
              className={`w-full rounded-xl border-2 px-3 py-3 text-sm font-semibold text-center transition-all duration-150 ${getItemStyle(item, selectedWord?.id === item.id)}`}
            >
              {item.text}
            </button>
          ))}
        </div>

        {/* Definitions column */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Nghĩa</p>
          {definitions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleDefClick(item)}
              disabled={item.matched}
              className={`w-full rounded-xl border-2 px-3 py-3 text-xs text-center transition-all duration-150 ${getItemStyle(item, selectedDef?.id === item.id)}`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
