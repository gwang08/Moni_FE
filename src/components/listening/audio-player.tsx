'use client';

import { useRef, useEffect, useState } from 'react';
import { useListeningStore } from '@/store/listening-store';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Volume2, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentTime, isPlaying, setCurrentTime, setIsPlaying } = useListeningStore();
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleError = () => {
      setError('Không thể tải file audio. Vui lòng thử lại sau.');
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [setCurrentTime, setIsPlaying]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError('Không thể phát audio. Vui lòng thử lại.');
    }
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertCircle className="h-6 w-6" />
          <div>
            <p className="font-medium">Audio không khả dụng</p>
            <p className="text-sm text-gray-500 mt-1">
              File audio mẫu chưa được thêm vào hệ thống. Bạn có thể đọc transcript bên dưới.
            </p>
          </div>
        </div>
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-4">
        <Button
          onClick={togglePlay}
          variant="default"
          disabled={isLoading}
          className="min-w-[48px]"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        <Button onClick={restart} variant="outline" size="icon" disabled={isLoading}>
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>{formatTime(currentTime)}</span>
            <div className="flex items-center gap-1">
              <Volume2 className="h-4 w-4" />
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div
            className="w-full bg-gray-200 rounded-full h-2 cursor-pointer hover:h-3 transition-all"
            onClick={handleSeek}
          >
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
