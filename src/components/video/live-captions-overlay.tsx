'use client';

import { Captions, CaptionsOff } from 'lucide-react';
import type { CaptionEntry } from '@/hooks/use-live-captions';

interface LiveCaptionsOverlayProps {
  captions: CaptionEntry[];
  enabled: boolean;
  supported: boolean;
  onToggle: () => void;
  /** Hide captions text but keep the toggle button visible. */
  showCaptions?: boolean;
  onToggleVisibility?: () => void;
}

export function LiveCaptionsOverlay({
  captions,
  enabled,
  supported,
  onToggle,
  showCaptions = true,
  onToggleVisibility,
}: LiveCaptionsOverlayProps) {
  // Sort newest first; show up to 2 most recent speakers
  const visible = [...captions].sort((a, b) => b.ts - a.ts).slice(0, 2);

  return (
    <>
      {/* Toggle button — top right */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <button
          onClick={onToggle}
          disabled={!supported}
          title={
            !supported
              ? 'Trình duyệt không hỗ trợ phụ đề (dùng Chrome/Edge)'
              : enabled
              ? 'Tắt phụ đề trực tiếp'
              : 'Bật phụ đề trực tiếp'
          }
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition shadow-lg backdrop-blur',
            !supported
              ? 'bg-gray-800/60 text-gray-400 cursor-not-allowed'
              : enabled
              ? 'bg-blue-500/90 text-white hover:bg-blue-600/90'
              : 'bg-black/60 text-white hover:bg-black/80',
          ].join(' ')}
        >
          {enabled ? <Captions className="h-3.5 w-3.5" /> : <CaptionsOff className="h-3.5 w-3.5" />}
          <span>CC</span>
        </button>
      </div>

      {/* Caption overlay — bottom center, Google Meet style */}
      {showCaptions && visible.length > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 max-w-[80%] w-fit pointer-events-none">
          <div className="space-y-1.5">
            {visible.reverse().map((c) => (
              <div
                key={c.userName}
                className="px-4 py-2 rounded-lg bg-black/75 backdrop-blur text-white shadow-xl"
              >
                <div className="text-[10px] uppercase tracking-wider text-blue-300 font-semibold mb-0.5">
                  {c.userName}
                </div>
                <div className={`text-sm leading-snug ${c.isFinal ? 'opacity-100' : 'opacity-80 italic'}`}>
                  {c.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suppress unused warning while keeping API extensible */}
      {onToggleVisibility ? null : null}
    </>
  );
}
