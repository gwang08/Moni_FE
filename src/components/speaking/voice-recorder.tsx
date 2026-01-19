'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useSpeakingStore } from '@/store/speaking-store';
import { Mic, Square, Play, Pause } from 'lucide-react';

interface VoiceRecorderProps {
  taskId: string;
  maxDuration: number;
}

export function VoiceRecorder({ taskId, maxDuration }: VoiceRecorderProps) {
  const { isRecording, startRecording, stopRecording } = useSpeakingStore();
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stopRecording(audioBlob, recordingTime, taskId);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      startRecording();
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            handleStopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex flex-col items-center gap-4">
        {!isRecording && !audioUrl && (
          <Button onClick={handleStartRecording} size="lg" className="gap-2">
            <Mic className="h-5 w-5" />
            Bắt đầu ghi âm
          </Button>
        )}

        {isRecording && (
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span className="font-bold">{formatTime(recordingTime)}</span>
              </div>
            </div>
            <Button onClick={handleStopRecording} variant="destructive" className="gap-2">
              <Square className="h-4 w-4" />
              Dừng ghi
            </Button>
          </div>
        )}

        {audioUrl && (
          <div className="w-full space-y-4">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />

            <div className="flex items-center justify-center gap-4">
              <Button onClick={togglePlayback} variant="outline">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <div className="text-sm text-gray-600">
                Đã ghi: {formatTime(recordingTime)}
              </div>
            </div>

            <Button onClick={() => { setAudioUrl(null); setRecordingTime(0); }} variant="outline" className="w-full">
              Ghi lại
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
