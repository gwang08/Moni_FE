'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSpeakingStore } from '@/store/speaking-store';
import { Mic, Square, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';

interface SpeakingRecorderProps {
  taskId: string;
  maxDuration?: number;
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

  // Cleanup audio URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = async () => {
    if (!navigator.mediaDevices) {
      setNoMicError(true);
      return;
    }
    setNoMicError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Pick MIME type compatible with browser (Safari uses mp4, Chrome uses webm)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleReRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Ghi âm
      </p>

      {noMicError && (
        <div className="flex items-center gap-2 text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Không thể truy cập microphone. Vui lòng cấp quyền và thử lại.
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        {/* Idle state */}
        {!isRecording && !audioUrl && (
          <button
            onClick={handleStart}
            className="w-20 h-20 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Mic className="h-8 w-8" />
          </button>
        )}
        {!isRecording && !audioUrl && (
          <p className="text-sm text-gray-500">Bắt đầu ghi âm</p>
        )}

        {/* Recording state */}
        {isRecording && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleStop}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg animate-pulse"
            >
              <Square className="h-8 w-8" />
            </button>
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-semibold">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Đang ghi âm... {formatTime(recordingTime)}
            </div>
            <Button variant="destructive" size="sm" onClick={handleStop} className="gap-1">
              <Square className="h-3 w-3" />
              Dừng ghi
            </Button>
          </div>
        )}

        {/* Playback state */}
        {audioUrl && (
          <div className="w-full space-y-3">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" onClick={togglePlayback}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <span className="text-sm text-gray-600">Đã ghi: {formatTime(recordingTime)}</span>
            </div>
            <Button
              variant="outline"
              onClick={handleReRecord}
              className="w-full gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4" />
              Ghi lại
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
