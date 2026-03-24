'use client';

import { useEffect, useRef, useState } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { Loader2, VideoOff } from 'lucide-react';
import { useCallRecorder } from '@/hooks/use-call-recorder';

interface DailyVideoCallProps {
  roomUrl: string;
  userName?: string;
  onJoined?: () => void;
  onLeave?: () => void;
  /** When true, mic audio is recorded and returned via onRecordingReady */
  enableRecording?: boolean;
  /** Called once after the user leaves and the recording blob is ready */
  onRecordingReady?: (blob: Blob) => void;
  className?: string;
}

export function DailyVideoCall({
  roomUrl,
  userName,
  onJoined,
  onLeave,
  enableRecording = false,
  onRecordingReady,
  className = '',
}: DailyVideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [state, setState] = useState<'loading' | 'joined' | 'error' | 'left'>('loading');

  const { startRecording, stopRecording, recordingBlob } = useCallRecorder();

  // Deliver the blob to the parent once it is ready after stop
  const onRecordingReadyRef = useRef(onRecordingReady);
  onRecordingReadyRef.current = onRecordingReady;

  useEffect(() => {
    if (recordingBlob && enableRecording) {
      onRecordingReadyRef.current?.(recordingBlob);
    }
  }, [recordingBlob, enableRecording]);

  useEffect(() => {
    if (!roomUrl || !containerRef.current) return;

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
    });

    callRef.current = frame;

    frame.on('joined-meeting', () => {
      setState('joined');
      onJoined?.();
      if (enableRecording) startRecording();
    });

    frame.on('left-meeting', () => {
      setState('left');
      if (enableRecording) stopRecording();
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
