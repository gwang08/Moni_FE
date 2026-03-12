'use client';

import { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useListeningStore } from '@/store/listening-store';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5];

interface Props {
  audioUrl: string;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ListeningAudioPlayer({ audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentTime, isPlaying, playbackRate, volume, duration,
    setCurrentTime, setIsPlaying, setPlaybackRate, setVolume, setDuration } = useListeningStore();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync playbackRate to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [playbackRate]);

  // Sync volume to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);
    const onMetadata = () => { setDuration(audio.duration); setLoading(false); };
    const onCanPlay = () => setLoading(false);
    const onError = () => { setError(true); setLoading(false); setIsPlaying(false); };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, [setCurrentTime, setIsPlaying, setDuration]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;
    try {
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { await audio.play(); setIsPlaying(true); }
    } catch { setError(true); }
  };

  const seek = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
    setCurrentTime(audio.currentTime);
  };

  const handleSeekBar = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const t = pct * duration;
    audio.currentTime = t;
    setCurrentTime(t);
  };

  if (!audioUrl || error) {
    return (
      <div className="bg-white border rounded-xl shadow-sm px-4 py-3 flex items-center gap-3 text-amber-600 sticky top-0 z-10">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span className="text-sm font-medium">Audio không khả dụng</span>
        {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
      </div>
    );
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white border rounded-xl shadow-sm px-4 py-3 sticky top-0 z-10">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Rewind */}
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => seek(-5)} disabled={loading}>
          <SkipBack className="h-4 w-4" />
        </Button>

        {/* Play/Pause */}
        <Button
          onClick={togglePlay}
          disabled={loading}
          className="h-9 w-9 shrink-0 rounded-full bg-violet-600 hover:bg-violet-700 text-white p-0"
        >
          {loading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        {/* Forward */}
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => seek(5)} disabled={loading}>
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Time */}
        <span className="text-xs text-gray-500 font-mono shrink-0 w-20 text-center">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Seek bar */}
        <div
          className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer relative hover:h-3 transition-all"
          onClick={handleSeekBar}
        >
          <div
            className="absolute left-0 top-0 h-full bg-violet-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1 shrink-0">
          {SPEED_OPTIONS.map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                playbackRate === rate
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1 shrink-0">
          <Volume2 className="h-4 w-4 text-gray-400" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-16 accent-violet-600"
          />
        </div>
      </div>
    </div>
  );
}
