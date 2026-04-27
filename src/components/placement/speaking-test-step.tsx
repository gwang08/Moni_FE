'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, RotateCcw, Clock, Volume2, Pause } from 'lucide-react';
import type { TestDetailResponse } from '@/types/test.types';

interface Props {
  testDetail: TestDetailResponse;
  audioBlob: Blob | null;
  onAudioChange: (blob: Blob | null) => void;
  onComplete: () => void;
  elapsedTime: string;
}

type Phase = 'idle' | 'speaking' | 'ready' | 'recording' | 'recorded';

export function SpeakingTestStep({ testDetail, audioBlob, onAudioChange, onComplete, elapsedTime }: Props) {
  const [phase, setPhaseState] = useState<Phase>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);

  const phaseRef = useRef<Phase>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioBlobRef = useRef<Blob | null>(audioBlob);

  // Wrapper to keep ref in sync with state
  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };

  // Keep ref in sync with prop
  useEffect(() => {
    audioBlobRef.current = audioBlob;
  }, [audioBlob]);

  // Extract question from test
  const question =
    testDetail.stimuli?.[0]?.content ||
    testDetail.stimuli?.[0]?.questionGroups?.[0]?.questions?.[0]?.content ||
    testDetail.description ||
    'Describe a topic you are interested in.';

  // Strip HTML tags for TTS
  const questionText = question.replace(/<[^>]*>/g, '').trim();
  const partNumber = testDetail.section || 1;

  // Auto-speak question on mount
  useEffect(() => {
    const timer = setTimeout(() => speakQuestion(), 500);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis?.cancel();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speakQuestion = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (phaseRef.current === 'idle') setPhase('ready');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith('en') && v.name.includes('Female')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];
    if (englishVoice) utterance.voice = englishVoice;

    // Remember phase before TTS starts so we can restore it
    const phaseBeforeTTS = phaseRef.current;

    utterance.onstart = () => {
      setIsTTSSpeaking(true);
    };
    utterance.onend = () => {
      setIsTTSSpeaking(false);
      // Only advance to 'ready' if we were in idle/speaking.
      // If user already recorded, stay in 'recorded'.
      if (phaseRef.current === 'idle' || phaseRef.current === 'speaking') {
        setPhase('ready');
      }
    };
    utterance.onerror = () => {
      setIsTTSSpeaking(false);
      if (phaseRef.current === 'idle' || phaseRef.current === 'speaking') {
        setPhase('ready');
      }
    };

    // Only set phase to 'speaking' if not already recorded
    if (phaseBeforeTTS === 'idle' || phaseBeforeTTS === 'ready') {
      setPhase('speaking');
    }

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    // Safety fallback — use ref for accurate phase check
    setTimeout(() => {
      if (phaseRef.current === 'speaking' || phaseRef.current === 'idle') {
        setIsTTSSpeaking(false);
        setPhase('ready');
      }
    }, 15000);
  }, [questionText]);

  const startRecording = useCallback(async () => {
    try {
      window.speechSynthesis?.cancel();
      setIsTTSSpeaking(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onAudioChange(blob);
        stream.getTracks().forEach((t) => t.stop());
        setPhase('recorded');
      };

      mediaRecorder.start(1000);
      setPhase('recording');
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      alert('Không thể truy cập microphone. Vui lòng cho phép trình duyệt sử dụng micro.');
    }
  }, [onAudioChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && phase === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [phase]);

  const resetRecording = () => {
    onAudioChange(null);
    setRecordingTime(0);
    setPhase('ready');
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const playbackAudio = () => {
    const blob = audioBlobRef.current;
    if (!blob) return;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;
    const audio = new Audio(url);
    audio.onended = () => setIsPlayingBack(false);
    audio.onerror = () => setIsPlayingBack(false);
    setIsPlayingBack(true);
    audio.play().catch(() => setIsPlayingBack(false));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-teal-50/40 via-white to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-200">
              <Mic className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Speaking - Part {partNumber}</h2>
              <p className="text-sm text-gray-500">Nghe câu hỏi, sau đó ghi âm câu trả lời</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            {elapsedTime}
          </div>
        </div>

        {/* Question Card */}
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 p-6 mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-500" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Question</span>
                {isTTSSpeaking && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                    <span className="flex gap-0.5">
                      <span className="w-1 h-3 bg-teal-500 rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" />
                      <span className="w-1 h-4 bg-teal-500 rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.1s]" />
                      <span className="w-1 h-2 bg-teal-500 rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.2s]" />
                    </span>
                    Đang phát...
                  </span>
                )}
              </div>
              <div
                className="text-lg text-gray-800 leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: question }}
              />
            </div>
            <button
              onClick={speakQuestion}
              disabled={isTTSSpeaking}
              className="shrink-0 p-3 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors disabled:opacity-50"
              title="Nghe lại câu hỏi"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Recording Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
          {/* Status bar */}
          <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Ghi âm câu trả lời
              </span>
              {(phase === 'recording' || phase === 'recorded') && (
                <span className="text-xs font-mono text-gray-600 bg-white px-2 py-0.5 rounded border">
                  {formatTime(recordingTime)}
                </span>
              )}
            </div>
          </div>

          <div className="p-8 flex flex-col items-center">
            {/* Phase: Idle / Speaking - TTS playing */}
            {(phase === 'idle' || phase === 'speaking') && (
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 rounded-full bg-teal-100 animate-ping opacity-20" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
                    <Volume2 className="h-10 w-10 text-teal-500 animate-pulse" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {isTTSSpeaking ? 'Đang đọc câu hỏi...' : 'Chuẩn bị đọc câu hỏi...'}
                </p>
              </div>
            )}

            {/* Phase: Ready - can start recording */}
            {phase === 'ready' && (
              <div className="text-center space-y-5">
                <p className="text-sm text-gray-600 font-medium">
                  Bấm nút bên dưới để bắt đầu trả lời
                </p>
                <button
                  onClick={startRecording}
                  className="group relative mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xl shadow-teal-200/50 hover:shadow-2xl hover:shadow-teal-300/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                >
                  <Mic className="h-10 w-10 transition-transform group-hover:scale-110" />
                </button>
                <p className="text-xs text-gray-400">
                  Bấm <Volume2 className="inline h-3 w-3 -mt-0.5" /> ở trên để nghe lại câu hỏi
                </p>
              </div>
            )}

            {/* Phase: Recording */}
            {phase === 'recording' && (
              <div className="text-center space-y-5">
                {/* Sound wave animation */}
                <div className="flex items-center justify-center gap-1 h-12">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-teal-500 rounded-full"
                      style={{
                        animation: `soundwave 0.8s ease-in-out ${i * 0.07}s infinite alternate`,
                        height: `${Math.random() * 30 + 10}px`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-semibold text-red-600">
                    Đang ghi âm — {formatTime(recordingTime)}
                  </span>
                </div>
                <button
                  onClick={stopRecording}
                  className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                >
                  <Square className="h-8 w-8" />
                </button>
                <p className="text-xs text-gray-400">Bấm để dừng ghi âm</p>
              </div>
            )}

            {/* Phase: Recorded - can playback or re-record */}
            {phase === 'recorded' && audioBlob && (
              <div className="text-center space-y-5 w-full max-w-xs">
                <div className="mx-auto w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                  <Mic className="h-8 w-8 text-teal-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Đã ghi âm xong — {formatTime(recordingTime)}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={playbackAudio}
                    disabled={isPlayingBack}
                    className="rounded-xl gap-2"
                  >
                    {isPlayingBack ? (
                      <><Pause className="h-4 w-4" /> Đang phát...</>
                    ) : (
                      <><Play className="h-4 w-4" /> Nghe lại</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetRecording}
                    className="rounded-xl gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <RotateCcw className="h-4 w-4" /> Ghi lại
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={onComplete}
            disabled={phase !== 'recorded' || !audioBlob}
            className="h-12 px-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-lg shadow-teal-200/50 disabled:opacity-40 disabled:shadow-none transition-all"
          >
            Nộp bài & Chấm điểm
          </Button>
        </div>
      </div>

      {/* Keyframe animation for sound wave */}
      <style jsx>{`
        @keyframes soundwave {
          0% { height: 8px; }
          100% { height: 40px; }
        }
      `}</style>
    </div>
  );
}
