import { useRef, useState, useCallback, useEffect } from 'react';
import type {
  ExamState,
  QuestionEvent,
  CueCardEvent,
  EvaluationEvent,
  ServerMessage,
  ClientMessage,
} from '@/types/speaking-exam.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
// http → ws, https → wss
const WS_BASE = API_URL.replace(/^http/, 'ws');

function getAuthToken(): string {
  const stored = localStorage.getItem('auth-storage');
  if (!stored) return '';
  try {
    const { state } = JSON.parse(stored);
    return state?.token || '';
  } catch {
    return '';
  }
}

export function useSpeakingExam() {
  const wsRef = useRef<WebSocket | null>(null);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [examState, setExamState] = useState<ExamState>('IDLE');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionEvent | null>(null);
  const [cueCard, setCueCard] = useState<CueCardEvent | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPendingAudio, setHasPendingAudio] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const currentQuestionRef = useRef<QuestionEvent | null>(null);
  const pausePlaybackRef = useRef(false);

  // ── Send helper ───────────────────────────────────────────
  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // ── Browser TTS (Replaces ElevenLabs) ───────────────────────────────────
  const pendingTextRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speakWithBrowserTTS = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      // No TTS available, start recording immediately
      setExamState('RECORDING');
      return;
    }

    // Detach old handlers to prevent old finalizeTTS from firing when cancel() is called
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    window.speechSynthesis.cancel(); // Cancel any ongoing speech first

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
    if (englishVoice) utterance.voice = englishVoice;

    const estimatedDurationMs = Math.max(3000, text.length * 60 + 1000); // More generous fallback
    let initialTimeout: NodeJS.Timeout;
    let durationTimeout: NodeJS.Timeout;

    const finalizeTTS = () => {
      clearTimeout(initialTimeout);
      clearTimeout(durationTimeout);
      setIsAudioPlaying(false);
      setExamState(prev => prev === 'AUDIO_PLAYING' ? 'RECORDING' : prev);
    };

    utterance.onstart = () => {
      clearTimeout(initialTimeout); // Clear the initial safety fallback
      setIsAudioPlaying(true);
      durationTimeout = setTimeout(finalizeTTS, estimatedDurationMs);
    };
    utterance.onend = finalizeTTS;
    utterance.onerror = finalizeTTS;

    // Prevent garbage collection bug in Chrome that kills onend
    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
    
    // Safety fallback: if utterance never starts within 4 seconds (cold boot delay)
    initialTimeout = setTimeout(finalizeTTS, 4000);
    
  }, []);

  // ── Message handler ───────────────────────────────────────
  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'question':
          const prevPart = currentQuestionRef.current?.partNumber;
          currentQuestionRef.current = msg;
          setCurrentQuestion(msg);
          pendingTextRef.current = msg.text;
          setExamState('AUDIO_PLAYING');
          
          const isNewPart3 = msg.partNumber === 3 && prevPart !== 3;

          if (pausePlaybackRef.current || isNewPart3) {
            pausePlaybackRef.current = true; // Auto-pause for Part 3 intro and logic consistency
            setHasPendingAudio(true);
          } else {
            speakWithBrowserTTS(msg.text);
          }
          break;

        case 'resume_exam':
          setExamState(msg.state);
          if (msg.part === 2) {
            setCueCard(msg.currentQuestion);
          } else {
            currentQuestionRef.current = msg.currentQuestion;
            setCurrentQuestion(msg.currentQuestion);
          }
          break;

        case 'show_cue_card':
          setCueCard(msg);
          setExamState('PART2_PREP');
          break;

        case 'heartbeat':
          // Mutual heartbeat: reply to backend
          wsRef.current?.send(JSON.stringify({ type: 'ack' }));
          break;

        case 'evaluating':
          setExamState('EVALUATING');
          break;

        case 'evaluation':
          setEvaluation(msg);
          setExamState('COMPLETED');
          break;

        case 'error':
          setError(msg.message);
          setExamState('CONN_ERROR');
          break;
      }
    },
    [speakWithBrowserTTS],
  );

  // ── Connect ───────────────────────────────────────────────
  const connect = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      setError('Không tìm thấy token xác thực');
      setExamState('CONN_ERROR');
      return;
    }

    setExamState('CONNECTING');

    // Close any existing connection to avoid duplicates
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(`${WS_BASE}/ws/speaking/exam?token=${token}`);

    ws.onopen = () => {
      console.log('[SpeakingExam] WS connected');
      setIsWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        handleMessage(msg);
      } catch (err) {
        console.error('[SpeakingExam] Parse error:', err);
      }
    };

    ws.onerror = () => {
      console.error('[SpeakingExam] WS error');
      // Don't set CONN_ERROR if we're evaluating — the backend might still be processing
      setExamState((prev) => {
        if (prev === 'EVALUATING') return prev; // keep EVALUATING state
        setError('WebSocket connection lost');
        return 'CONN_ERROR';
      });
    };

    ws.onclose = (event) => {
      console.log('[SpeakingExam] WS closed, code:', event.code);
      setIsWsConnected(false);

      // If WS closes while evaluating, don't crash — show timeout message
      setExamState((prev) => {
        if (prev === 'EVALUATING') {
          // WS died during evaluation — backend is still processing
          // Show a friendly message instead of infinite spinner
          setError('Evaluation is taking longer than expected. Your results will be available in your test history shortly.');
          return 'CONN_ERROR';
        }
        return prev;
      });
    };

    wsRef.current = ws;

    // Keepalive ping every 25s to prevent WS timeout during long evaluation
    if (keepaliveRef.current) clearInterval(keepaliveRef.current);
    keepaliveRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }, [handleMessage]);

  // ── Actions ───────────────────────────────────────────────
  const startExam = useCallback(
    (testId: number) => send({ type: 'start_exam', testId }),
    [send],
  );

  const sendTranscript = useCallback(
    (partNumber: number, questionId: number, text: string, audioUrl?: string) => {
      send({ type: 'transcript', partNumber, questionId, text, audioUrl: audioUrl || '' });
      setExamState('PROCESSING');
    },
    [send],
  );

  const startSpeakingPart2 = useCallback(() => {
    send({ type: 'start_speaking_part2' });
    setExamState('PART2_SPEAKING');
  }, [send]);

  const stopSpeakingPart2 = useCallback(
    (text: string, audioUrl?: string) => send({ type: 'stop_speaking_part2', text, audioUrl: audioUrl || '' }),
    [send],
  );

  const endExam = useCallback(() => send({ type: 'end_exam' }), [send]);

  const disconnect = useCallback(() => {
    if (keepaliveRef.current) {
      clearInterval(keepaliveRef.current);
      keepaliveRef.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsWsConnected(false);
  }, []);

  const setPausePlayback = useCallback((paused: boolean) => {
    pausePlaybackRef.current = paused;
  }, []);

  const playPendingAudio = useCallback(() => {
    if (hasPendingAudio) {
      if (pendingTextRef.current) {
         speakWithBrowserTTS(pendingTextRef.current);
      } else {
         setExamState(prev => prev === 'AUDIO_PLAYING' ? 'RECORDING' : prev);
      }
      setHasPendingAudio(false);
      pendingTextRef.current = null;
    }
  }, [hasPendingAudio, speakWithBrowserTTS]);

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  // Because we force RECORDING state in finalizeTTS (or playPendingAudio),
  // we do not need the complex useEffect hook assessing audio.isAudioPlaying here anymore.

  return {
    examState,
    currentQuestion,
    cueCard,
    evaluation,
    error,
    isWsConnected,
    isAudioPlaying: isAudioPlaying,
    connect,
    startExam,
    sendTranscript,
    startSpeakingPart2,
    stopSpeakingPart2,
    endExam,
    disconnect,
    setPausePlayback,
    playPendingAudio
  };
}
