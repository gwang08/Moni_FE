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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-4">
          <div className="w-full max-w-[540px] rounded-3xl border border-white/10 bg-[#3b3b3b]/95 px-8 py-10 text-center shadow-2xl shadow-black/30">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
              <Headphones className="h-12 w-12 text-white" />
            </div>
            <p className="mx-auto max-w-md text-[15px] leading-7 text-white/90">
              You will be listening to an audio clip during this test. You will not be permitted to pause or rewind the audio while answering the questions.
            </p>
            <p className="mt-6 text-sm text-white/75">
              To continue, click Play.
            </p>
            <button
              type="button"
              onClick={startAudio}
              className="mt-6 inline-flex h-14 min-w-[118px] items-center justify-center gap-3 rounded-xl bg-black px-6 text-base font-medium text-white shadow-lg shadow-black/30 transition-transform hover:scale-[1.02] disabled:opacity-60"
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
