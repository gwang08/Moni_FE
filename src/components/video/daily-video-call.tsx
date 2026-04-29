'use client';

import { useEffect, useRef, useState } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { Loader2, VideoOff } from 'lucide-react';
import { useCallRecorder } from '@/hooks/use-call-recorder';
import { useLiveCaptions } from '@/hooks/use-live-captions';
import { LiveCaptionsOverlay } from './live-captions-overlay';

interface DailyVideoCallProps {
  roomUrl: string;
  userName?: string;
  onJoined?: () => void;
  onLeave?: () => void;
  enableRecording?: boolean;
  onRecordingReady?: (blob: Blob) => void;
  /** Ref to expose stopRecording so parent can stop recording externally */
  stopRecordingRef?: React.MutableRefObject<(() => void) | null>;
  /** Enable live captions overlay (Web Speech API + Daily app-message). Default true. */
  enableCaptions?: boolean;
  className?: string;
}

export function DailyVideoCall({
  roomUrl,
  userName,
  onJoined,
  onLeave,
  enableRecording = false,
  onRecordingReady,
  stopRecordingRef,
  enableCaptions = true,
  className = '',
}: DailyVideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [state, setState] = useState<'loading' | 'joined' | 'error' | 'left'>('loading');
  const [callReady, setCallReady] = useState(false);

  const captions = useLiveCaptions({
    callRef,
    userName: userName || 'Participant',
    autoStart: enableCaptions && callReady,
  });

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
      setCallReady(true);
      onJoined?.();
      if (enableRecording) {
        startRecording();
        if (stopRecordingRef) stopRecordingRef.current = stopRecording;
      }
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

    // Set a timeout — if join takes more than 15s, show error
    const joinTimeout = setTimeout(() => {
      if (state === 'loading') setState('error');
    }, 15000);

    frame.join({ url: roomUrl, userName: userName || 'Participant' })
      .then(() => clearTimeout(joinTimeout))
      .catch(() => { clearTimeout(joinTimeout); setState('error'); });

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
          <div className="text-center space-y-4">
            <VideoOff className="h-8 w-8 text-red-400 mx-auto" />
            <p className="text-red-400 text-sm">Kết nối video thất bại</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition"
              >
                Thử lại
              </button>
              <p className="text-gray-500 text-xs">
                Hoặc mở trực tiếp: <a href={roomUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">{roomUrl?.split('/').pop()}</a>
              </p>
            </div>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      {enableCaptions && state === 'joined' && (
        <LiveCaptionsOverlay
          captions={captions.captions}
          enabled={captions.broadcasting}
          supported={captions.supported}
          onToggle={captions.toggle}
        />
      )}
    </div>
  );
}
