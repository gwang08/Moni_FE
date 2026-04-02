'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Headphones, Play } from 'lucide-react';
import { useListeningStore } from '@/store/listening-store';

interface Props {
  audioUrl: string;
}

export function ListeningAudioPlayer({ audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setPlaybackRate,
    setVolume,
    registerSeekCallback,
  } = useListeningStore();
  const [error, setError] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setError(false);
      setHasStarted(false);
      setIsPlaying(false);
      setPlaybackRate(1);
      setVolume(1);
      registerSeekCallback(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [audioUrl, registerSeekCallback, setIsPlaying, setPlaybackRate, setVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = 1;
    audio.volume = 1;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setError(true);
      setIsPlaying(false);
    };

    registerSeekCallback((time: number) => {
      if (audioRef.current) {
        const maxTime = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : time;
        audioRef.current.currentTime = Math.max(0, Math.min(maxTime, time));
        setCurrentTime(audioRef.current.currentTime);
      }
    });

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      registerSeekCallback(null);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, registerSeekCallback, setCurrentTime, setDuration, setIsPlaying]);

  const startAudio = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    try {
      setHasStarted(true);
      await audio.play();
      setIsPlaying(true);
    } catch {
      setError(true);
      setIsPlaying(false);
    }
  };

  if (!audioUrl || error) {
    return (
      <div className="shrink-0 bg-orange-50 border-t border-orange-200/60 px-5 py-3 flex items-center gap-3 text-amber-600">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span className="text-sm font-medium">Audio khong kha dung</span>
        {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />}
      </div>
    );
  }

  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />

      {!hasStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] px-4">
          <div className="w-full max-w-[500px] rounded-2xl border border-white/15 bg-[#2a2a2a]/98 px-10 py-12 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center">
              <Headphones className="h-14 w-14 text-white" />
            </div>
            <p className="mx-auto max-w-md text-sm leading-7 text-white/95">
              You will be listening to an audio clip during this test. You will not be permitted to pause or rewind the audio while answering the questions.
            </p>
            <p className="mt-5 text-sm text-white/80">
              To continue, click Play.
            </p>
            <button
              type="button"
              onClick={startAudio}
              className="mt-6 inline-flex h-12 min-w-[140px] items-center justify-center gap-2.5 rounded-lg bg-black px-7 text-sm font-medium text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-gray-900 disabled:opacity-60"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>Play</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
