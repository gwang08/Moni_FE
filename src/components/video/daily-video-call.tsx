'use client';

import { useEffect, useRef, useState } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { Loader2, VideoOff } from 'lucide-react';

interface DailyVideoCallProps {
  roomUrl: string;
  userName?: string;
  onJoined?: () => void;
  onLeave?: () => void;
  className?: string;
}

export function DailyVideoCall({ roomUrl, userName, onJoined, onLeave, className = '' }: DailyVideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [state, setState] = useState<'loading' | 'joined' | 'error' | 'left'>('loading');

  useEffect(() => {
    if (!roomUrl || !containerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const frame = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '12px',
      },
      showLeaveButton: true,
      showFullscreenButton: true,
      showParticipantsBar: false,
      layout: 'grid',
    } as any);

    callRef.current = frame;

    frame.on('joined-meeting', () => {
      setState('joined');
      onJoined?.();
    });
    frame.on('left-meeting', () => {
      setState('left');
      onLeave?.();
    });
    frame.on('error', (e) => {
      console.error('Daily.co error:', e);
      setState('error');
    });

    frame.join({ url: roomUrl, userName: userName || 'Participant' }).catch(() => setState('error'));

    return () => {
      frame.destroy();
      callRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomUrl]);

  if (!roomUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-xl ${className}`}>
        <div className="text-center space-y-3">
          <VideoOff className="h-10 w-10 text-gray-500 mx-auto" />
          <p className="text-gray-400 text-sm">Đang chờ phòng video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-900 rounded-xl overflow-hidden ${className}`}>
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
            <p className="text-gray-300 text-sm">Đang kết nối video...</p>
          </div>
        </div>
      )}
      {state === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
          <div className="text-center space-y-3">
            <VideoOff className="h-8 w-8 text-red-400 mx-auto" />
            <p className="text-red-400 text-sm">Kết nối video thất bại</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
