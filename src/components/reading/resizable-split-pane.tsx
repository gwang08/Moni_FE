'use client';

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

interface ResizableSplitPaneProps {
  leftPane: ReactNode;
  rightPane: ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  storageKey?: string;
}

const HANDLE_WIDTH = 2;
const DEFAULT_LEFT_WIDTH = 54;
const MIN_LEFT_WIDTH = 30;
const MAX_LEFT_WIDTH = 75;

export function ResizableSplitPane({
  leftPane,
  rightPane,
  defaultLeftWidth = DEFAULT_LEFT_WIDTH,
  minLeftWidth = MIN_LEFT_WIDTH,
  maxLeftWidth = MAX_LEFT_WIDTH,
  storageKey,
}: ResizableSplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed >= minLeftWidth && parsed <= maxLeftWidth) {
          return parsed;
        }
      }
    }
    return defaultLeftWidth;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Save width to localStorage when it changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, String(leftWidth));
    }
  }, [leftWidth, storageKey]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      startWidthRef.current = leftWidth;
    },
    [leftWidth]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.touches[0].clientX;
      startWidthRef.current = leftWidth;
    },
    [leftWidth]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;

      let newWidth = startWidthRef.current + deltaPercent;
      newWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newWidth));

      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const deltaX = e.touches[0].clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;

      let newWidth = startWidthRef.current + deltaPercent;
      newWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newWidth));

      setLeftWidth(newWidth);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

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
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 flex overflow-hidden bg-[#f5f6f8] relative"
      style={{ userSelect: isDragging ? 'none' : undefined }}
    >
      {/* Left pane */}
      <div
        className="bg-white overflow-hidden transition-none"
        style={{ width: `${leftWidth}%` }}
      >
        <div className="h-full overflow-y-auto reading-scrollbar px-6 py-6">
          {leftPane}
        </div>
      </div>

      {/* Resizer handle */}
      <div
        className="relative z-10 flex items-center justify-center bg-gray-400"
        style={{ width: HANDLE_WIDTH }}
      >
        <div
          className="group relative h-full cursor-col-resize"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Drag handle icon - centered vertically, always visible */}
          <div
            className="w-8 lg:w-9 bg-white group-hover:border-[#418ec8] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-0 lg:-translate-x-[22px] lg:-translate-y-1/2 z-10 aspect-square flex items-center justify-center border-2 border-[rgba(0,0,0,.5)] shadow-md"
            tabIndex={0}
            style={{ stroke: 'rgba(0, 0, 0, 0.5)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="512"
              height="512"
              viewBox="0 0 24 24"
              className="w-4 h-4 stroke-inherit stroke-2 fill-inherit"
            >
              <g>
                <path
                  d="M6.53 7.47a.75.75 0 0 1 0 1.06l-3.47 3.473 3.464 3.467a.75.75 0 1 1-1.06 1.06l-3.995-3.997a.75.75 0 0 1 0-1.06l4-4.003a.75.75 0 0 1 1.061 0z"
                  opacity="1"
                />
                <path
                  d="M17.476 7.47a.75.75 0 0 1 1.06 0l3.994 3.997a.75.75 0 0 1 0 1.06l-4 4.003a.75.75 0 1 1-1.06-1.06l3.47-3.473-3.464-3.467a.75.75 0 0 1 0-1.06z"
                  opacity="1"
                />
                <path
                  d="M1.25 12a.75.75 0 0 1 .75-.75h20a.75.75 0 0 1 0 1.5H2a.75.75 0 0 1-.75-.75z"
                  opacity="1"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Right pane */}
      <div
        className="flex-1 bg-white overflow-hidden"
        style={{ width: `${100 - leftWidth}%` }}
      >
        <div className="h-full overflow-y-auto reading-scrollbar px-6 py-6">
          {rightPane}
        </div>
      </div>
    </div>
  );
}
