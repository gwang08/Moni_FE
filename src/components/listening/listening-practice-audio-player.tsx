import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Gauge } from 'lucide-react';

interface Props {
  audioUrl: string;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const ListeningPracticeAudioPlayer = forwardRef<HTMLAudioElement, Props>(({ audioUrl }, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  useImperativeHandle(ref, () => audioRef.current!);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setIsPlaying(false);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Initial state
    setIsPlaying(!audio.paused);
    setCurrentTime(audio.currentTime);
    if (audio.duration) setDuration(audio.duration);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl]);

  // Close speed menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch {
      console.error('Failed to play audio');
    }
  }, [isPlaying, audioRef]);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  }, [duration, audioRef]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }, [audioRef]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
    setIsMuted(vol === 0);
  }, [audioRef]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted, audioRef]);

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
    setShowSpeedMenu(false);
  }, [audioRef]);

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) return null;

  return (
    <div className="shrink-0" style={{ backgroundColor: '#FFF5F2', borderTop: '1px solid #F5D5C8' }}>
      {/* Progress bar */}
      <div className="relative w-full h-1 bg-gray-200 cursor-pointer group">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute left-0 top-0 h-full rounded-r transition-all"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, backgroundColor: '#D55223' }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 6px)`, backgroundColor: '#D55223' }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-5 py-3">
        {/* Left: Time and Volume */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-mono min-w-[100px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 cursor-pointer"
              style={{ accentColor: '#D55223' }}
            />
          </div>
        </div>

        {/* Center: Playback controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => skip(-5)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 transition-colors relative"
            style={{ '--tw-ring-color': 'transparent' } as React.CSSProperties}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5D5C8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Lùi 5 giây"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="absolute text-[8px] font-bold">5</span>
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 flex items-center justify-center rounded-full text-white transition-colors shadow-lg"
            style={{ backgroundColor: '#D55223' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C2471D')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#D55223')}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 fill-white" />
            ) : (
              <Play className="h-6 w-6 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => skip(5)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 transition-colors relative"
            style={{ '--tw-ring-color': 'transparent' } as React.CSSProperties}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5D5C8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Tiến 5 giây"
          >
            <RotateCw className="h-5 w-5" />
            <span className="absolute text-[8px] font-bold">5</span>
          </button>
        </div>

        {/* Right: Speed control */}
        <div className="relative" ref={speedMenuRef}>
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Gauge className="h-5 w-5" />
            <span className="text-sm font-medium">Tốc độ: {playbackRate}x</span>
          </button>

          {showSpeedMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                    playbackRate === rate ? 'font-semibold' : 'text-gray-700'
                  }`}
                  style={{
                    color: playbackRate === rate ? '#D55223' : undefined,
                    backgroundColor: playbackRate === rate ? '#FFF5F2' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (playbackRate !== rate) e.currentTarget.style.backgroundColor = '#FFF5F2';
                  }}
                  onMouseLeave={(e) => {
                    if (playbackRate !== rate) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
    </div>
  );
});

ListeningPracticeAudioPlayer.displayName = 'ListeningPracticeAudioPlayer';
