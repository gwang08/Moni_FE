'use client';

import { useRef, useEffect } from 'react';
import { useListeningStore } from '@/store/listening-store';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentTime, isPlaying, setCurrentTime, setIsPlaying } = useListeningStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setIsPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <audio ref={audioRef} src={audioUrl} />

      <div className="flex items-center gap-4">
        <Button onClick={togglePlay} variant="default">
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>

        <Button onClick={restart} variant="outline" size="icon">
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <div className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(audioRef.current?.duration || 0)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${
                  audioRef.current?.duration
                    ? (currentTime / audioRef.current.duration) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
