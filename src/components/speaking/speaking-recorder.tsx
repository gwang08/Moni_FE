'use client';

import { useState, useRef, useEffect } from 'react';
import { useSpeakingStore } from '@/store/speaking-store';
import { Mic, Square, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';

interface SpeakingRecorderProps {
  taskId: string;
  maxDuration?: number;
  existingBlob?: Blob | null;
  onRecordingComplete: (blob: Blob, duration: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SpeakingRecorder({
  taskId,
  maxDuration = 180,
  existingBlob,
  onRecordingComplete,
}: SpeakingRecorderProps) {
  const { isRecording, startRecording, stopRecording } = useSpeakingStore();
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [noMicError, setNoMicError] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Restore audio from existing blob when navigating back
  useEffect(() => {
    if (existingBlob && !audioUrl) {
      const url = URL.createObjectURL(existingBlob);
      setAudioUrl(url);
    }
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingBlob]);

  const handleStart = async () => {
    if (!navigator.mediaDevices) { setNoMicError(true); return; }
    setNoMicError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stopRecording(blob, recordingTime, taskId);
        onRecordingComplete(blob, recordingTime);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      startRecording();
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          if (next >= maxDuration) handleStop();
          return next;
        });
      }, 1000);
    } catch {
      setNoMicError(true);
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleReRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40 backdrop-blur-sm border border-orange-100/60 shadow-sm p-6 mt-4 overflow-hidden">
      {/* Subtle bg glow */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-orange-200/15 blur-2xl" />

      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
        <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 inline-flex items-center justify-center">
          <Mic className="h-3 w-3 text-orange-500" />
        </span>
        Ghi âm
      </span>

      {noMicError && (
        <div className="flex items-center gap-2.5 text-red-600 text-sm mb-5 bg-red-50/80 border border-red-200/50 p-3 rounded-2xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {'Không thể truy cập microphone. Vui lòng cấp quyền và thử lại.'}
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        {/* Idle state */}
        {!isRecording && !audioUrl && (
          <>
            <div className="relative group">
              {/* Pulsing ring on hover */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 opacity-0 group-hover:opacity-20 scale-100 group-hover:scale-125 transition-all duration-500 blur-md" />
              <button
                onClick={handleStart}
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white flex items-center justify-center shadow-xl shadow-orange-300/30 transition-all duration-200 hover:scale-105 active:scale-95 border border-orange-300/20"
              >
                <Mic className="h-8 w-8" />
              </button>
            </div>
            <p className="text-sm text-gray-400 font-medium">
              {'Nhấn để bắt đầu ghi âm'}
            </p>
          </>
        )}

        {/* Recording state */}
        {isRecording && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {/* Animated concentric rings */}
              <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute -inset-3 rounded-full bg-red-400/10 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute -inset-6 rounded-full bg-red-400/5 animate-ping" style={{ animationDuration: '2.5s' }} />
              <button
                onClick={handleStop}
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white flex items-center justify-center shadow-xl shadow-red-400/30 transition-all duration-200 hover:scale-105 border border-red-400/20"
              >
                <Square className="h-7 w-7" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-red-50/80 border border-red-200/50 text-red-600 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {'Đang ghi âm...'} {formatTime(recordingTime)}
            </div>

            {/* Waveform-like animation */}
            <div className="flex items-center gap-0.5 h-6">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-red-400 to-rose-300 rounded-full animate-pulse"
                  style={{
                    height: `${8 + Math.sin(i * 0.8) * 12 + Math.random() * 4}px`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${0.4 + Math.random() * 0.3}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Playback state */}
        {audioUrl && (
          <div className="w-full space-y-3">
            <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={togglePlayback}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-300/30 transition-all duration-200 hover:scale-105 border border-orange-300/20"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>
              <span className="text-sm text-gray-500 font-medium tabular-nums">
                {'Đã ghi:'} {formatTime(recordingTime)}
              </span>
            </div>
            <button
              onClick={handleReRecord}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-orange-200/60 text-orange-600 text-sm font-medium hover:bg-orange-50/60 hover:border-orange-300/60 transition-all duration-200 hover:scale-[1.01]"
            >
              <RotateCcw className="h-4 w-4" />
              Ghi lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
