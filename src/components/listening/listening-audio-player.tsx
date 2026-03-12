'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { useListeningStore } from '@/store/listening-store';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5];

interface Props { audioUrl: string; }

function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function ListeningAudioPlayer({ audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const { currentTime, isPlaying, playbackRate, volume, duration,
    setCurrentTime, setIsPlaying, setPlaybackRate, setVolume, setDuration } = useListeningStore();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackRate; }, [playbackRate]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => { if (!isDragging) setCurrentTime(audio.currentTime); };
    const onEnd = () => setIsPlaying(false);
    const onMeta = () => { setDuration(audio.duration); setLoading(false); };
    const onReady = () => setLoading(false);
    const onErr = () => { setError(true); setLoading(false); setIsPlaying(false); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('canplay', onReady);
    audio.addEventListener('error', onErr);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('canplay', onReady);
      audio.removeEventListener('error', onErr);
    };
  }, [setCurrentTime, setIsPlaying, setDuration, isDragging]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;
    try {
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { await audio.play(); setIsPlaying(true); }
    } catch { setError(true); }
  };

  const seek = (delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(duration, a.currentTime + delta));
    setCurrentTime(a.currentTime);
  };

  const seekToPos = useCallback((clientX: number) => {
    const a = audioRef.current, bar = seekBarRef.current;
    if (!a || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;
    a.currentTime = t;
    setCurrentTime(t);
  }, [duration, setCurrentTime]);

  const onSeekDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    seekToPos(e.clientX);
    const move = (ev: MouseEvent) => seekToPos(ev.clientX);
    const up = () => { setIsDragging(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!audioUrl || error) {
    return (
      <div className="shrink-0 bg-orange-50 border-t border-orange-200/60 px-5 py-3 flex items-center gap-3 text-amber-600">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span className="text-sm font-medium">Audio không khả dụng</span>
        {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
      </div>
    );
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="shrink-0 bg-gradient-to-t from-indigo-50/60 via-white to-white border-t border-gray-100 px-5 pt-1.5 pb-1.5">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Seek bar — full width */}
      <div className="mb-1.5">
        <div
          ref={seekBarRef}
          className="relative h-2 bg-gray-200/80 rounded-full cursor-pointer group"
          onMouseDown={onSeekDrag}
        >
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Left: time + volume */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-mono tabular-nums w-[90px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full relative">
            <div
              className="absolute left-0 top-0 h-full bg-orange-400 rounded-full"
              style={{ width: `${volume * 100}%` }}
            />
            <input
              type="range" min={0} max={1} step={0.1} value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Center: skip back, play, skip forward */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => seek(-5)}
            disabled={loading}
            className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 text-gray-500"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={togglePlay}
            disabled={loading}
            className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-300/40 transition-all hover:scale-105 disabled:opacity-40"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </button>
          <button
            onClick={() => seek(5)}
            disabled={loading}
            className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 text-gray-500"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Right: speed */}
        <div className="flex items-center gap-1.5 bg-gray-50 rounded-full px-2 py-1 border border-gray-200/60">
          <span className="text-[11px] text-gray-400">Tốc độ:</span>
          {SPEED_OPTIONS.map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-all ${
                playbackRate === rate
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
