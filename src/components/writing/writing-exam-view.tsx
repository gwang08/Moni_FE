'use client';

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { Wifi, Bell, Menu, ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react';
import type { WritingTaskType } from '@/types/writing.types';

interface WritingExamViewProps {
  prompt: string;
  chartImageUrl?: string;
  taskType: WritingTaskType;
  content: string;
  wordCount: number;
  readOnly: boolean;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitted: boolean;
  /** Countdown timer display (e.g. "19:42") */
  countdownDisplay: string;
  /** Remaining seconds from exam session */
  remainingSeconds?: number;
  testTitle?: string;
  // Navigation props
  totalTasks?: number;
  activeTaskIndex?: number;
  onTaskChange?: (index: number) => void;
  taskTypes?: WritingTaskType[];
}

const INSTRUCTIONS: Record<number, string> = {
  1: 'You should spend about 20 minutes on this task. Write at least 150 words.',
  2: 'You should spend about 40 minutes on this task. Write at least 250 words.',
};

const MIN_LEFT_WIDTH = 35;
const MAX_LEFT_WIDTH = 75;
const DEFAULT_LEFT_WIDTH = 50;
const HANDLE_WIDTH = 2;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export function WritingExamView({
  prompt,
  chartImageUrl,
  taskType,
  content,
  wordCount,
  readOnly,
  onContentChange,
  onSubmit,
  isSubmitting,
  submitted,
  countdownDisplay,
  remainingSeconds,
  testTitle,
  totalTasks = 1,
  activeTaskIndex = 0,
  onTaskChange,
  taskTypes = [2],
}: WritingExamViewProps) {
  // Resizable divider state
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Local word count for the textarea (computed from content prop)
  const localWordCount = countWords(content);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
  }, [leftWidth]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
    startWidthRef.current = leftWidth;
  }, [leftWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      let newWidth = startWidthRef.current + deltaPercent;
      newWidth = Math.max(MIN_LEFT_WIDTH, Math.min(MAX_LEFT_WIDTH, newWidth));
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const deltaX = e.touches[0].clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      let newWidth = startWidthRef.current + deltaPercent;
      newWidth = Math.max(MIN_LEFT_WIDTH, Math.min(MAX_LEFT_WIDTH, newWidth));
      setLeftWidth(newWidth);
    };

    const handleTouchEnd = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Warn when time is running low (< 5 min)
  const isTimeWarning = remainingSeconds != null && remainingSeconds > 0 && remainingSeconds < 300;
  const isTimeUp = remainingSeconds != null && remainingSeconds <= 0;

  const canGoPrev = activeTaskIndex > 0;
  const canGoNext = activeTaskIndex < totalTasks - 1;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-white">
      {/* ===== Top bar: IELTS style ===== */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2 shrink-0">
        {/* Left: IELTS logo + timer */}
        <div className="flex items-center gap-4">
          {/* IELTS logo (red) */}
          <div className="flex items-center">
            <span className="text-[#e31837] text-xl font-black tracking-tight select-none" style={{ fontFamily: 'Arial Black, sans-serif' }}>
              IELTS<span className="text-[8px] align-super ml-0.5 font-normal text-gray-500">™</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2.5 py-1">
            <Clock className="h-3.5 w-3.5 text-gray-500" />
            <span className={`text-xs font-mono tabular-nums font-semibold ${
              isTimeUp ? 'text-red-600' : isTimeWarning ? 'text-orange-500' : 'text-gray-700'
            }`}>
              {countdownDisplay}
            </span>
          </div>
        </div>

        {/* Right: WiFi, Bell, Menu icons */}
        <div className="flex items-center gap-3">
          <Wifi className="h-4 w-4 text-gray-400" />
          <Bell className="h-4 w-4 text-gray-400" />
          <Menu className="h-5 w-5 text-gray-400 cursor-pointer" />
        </div>
      </div>

      {/* ===== Instruction banner ===== */}
      <div className="bg-[#f0f0eb] border-b border-gray-200 px-4 py-2.5">
        <p className="text-sm font-bold text-gray-800">Part {taskType}</p>
        <p className="text-xs text-gray-600 mt-0.5">{INSTRUCTIONS[taskType]}</p>
      </div>

      {/* ===== Main two-pane content area ===== */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex overflow-hidden relative"
        style={{ userSelect: isDragging ? 'none' : undefined }}
      >
        {/* Left pane - Question */}
        <div className="overflow-hidden" style={{ width: `${leftWidth}%` }}>
          <div className="h-full overflow-y-auto px-8 py-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-[15px] text-gray-800 leading-relaxed space-y-4 font-medium">
                <div dangerouslySetInnerHTML={{ __html: prompt }} />
              </div>
              {chartImageUrl && (
                <div className="mt-6 flex justify-center">
                  <Image
                    src={chartImageUrl}
                    alt="Chart"
                    width={500}
                    height={350}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resizer handle */}
        <div
          className="relative z-10 flex items-center justify-center bg-gray-300"
          style={{ width: HANDLE_WIDTH }}
        >
          <div
            className="group relative h-full cursor-col-resize"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div
              className="w-7 bg-white group-hover:border-[#418ec8] absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 z-10 aspect-square flex items-center justify-center border border-gray-400 shadow-sm"
              tabIndex={0}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                className="stroke-gray-600 stroke-2 fill-none"
              >
                <path d="M8 6l-4 6 4 6" />
                <path d="M16 6l4 6-4 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right pane - Textarea */}
        <div className="flex-1 overflow-hidden" style={{ width: `${100 - leftWidth}%` }}>
          <div className="h-full flex flex-col px-6 py-6">
            <div className="flex-1 relative border border-gray-400 focus-within:border-gray-600 rounded-sm">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  onContentChange(e.target.value);
                }}
                placeholder="Write your answer here..."
                readOnly={readOnly || submitted}
                className="absolute inset-0 w-full h-full resize-none focus:outline-none px-4 py-3 text-sm text-gray-800 leading-relaxed placeholder:text-gray-400 overflow-y-auto"
              />
            </div>
            <p className="text-xs text-gray-600 text-right mt-1.5 font-medium">
              Words: {localWordCount}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Bottom navigation bar ===== */}
      <div className="shrink-0 bg-white border-t border-gray-300 px-4 py-1">
        <div className="flex items-center justify-between gap-3">
          {/* Part navigation (Mini-map style) */}
          <div className="flex items-center gap-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {taskTypes.map((tType, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onTaskChange?.(idx)}
                className={`shrink-0 text-sm font-bold pb-1 transition-colors border-b-2 ${
                  idx === activeTaskIndex
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                Part {tType}
              </button>
            ))}
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-2 shrink-0 pb-1">
            <button
              onClick={() => canGoPrev && onTaskChange?.(activeTaskIndex - 1)}
              disabled={!canGoPrev}
              className={`w-[34px] h-[34px] flex items-center justify-center rounded transition-colors ${
                canGoPrev
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </button>

            <button
              onClick={() => canGoNext && onTaskChange?.(activeTaskIndex + 1)}
              disabled={!canGoNext}
              className={`w-[34px] h-[34px] flex items-center justify-center rounded transition-colors ${
                canGoNext
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowRight className="h-[18px] w-[18px]" />
            </button>

            {/* Submit button */}
            <button
              onClick={onSubmit}
              disabled={isSubmitting || submitted || wordCount === 0}
              className={`w-[34px] h-[34px] flex items-center justify-center rounded transition-colors ${
                submitted
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isSubmitting || wordCount === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title={submitted ? 'Đã nộp' : 'Nộp bài'}
            >
              {submitted ? (
                <Check className="h-[18px] w-[18px] text-green-600" />
              ) : (
                <Check className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
