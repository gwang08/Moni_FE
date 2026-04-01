import { useRef, useState, useCallback, useEffect } from 'react';
import { useSpeakingExamAudio } from './use-speaking-exam-audio';
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

  const audio = useSpeakingExamAudio();

  // ── Send helper ───────────────────────────────────────────
  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // ── Browser TTS fallback ───────────────────────────────────
  const pendingTextRef = useRef<string | null>(null);
  const hasReceivedChunksRef = useRef(false);

  const speakWithBrowserTTS = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    // Try to find an English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => audio.setIsAudioPlaying(true);
    utterance.onend = () => audio.setIsAudioPlaying(false);
    utterance.onerror = () => audio.setIsAudioPlaying(false);

    // Mark as playing via audio state
    window.speechSynthesis.cancel(); // cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
    console.log('[TTS Fallback] Reading question with browser voice');
  }, [audio]);

  // ── Message handler ───────────────────────────────────────
  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'question':
          setCurrentQuestion(msg);
          audio.resetChunks();
          pendingTextRef.current = msg.text;
          hasReceivedChunksRef.current = false;
          setExamState('AUDIO_PLAYING');
          break;

        case 'audio_chunk':
          audio.pushChunk(msg.data);
          hasReceivedChunksRef.current = true;
          break;

        case 'audio_end':
          if (hasReceivedChunksRef.current) {
            // ElevenLabs TTS succeeded — play the audio chunks  
            audio.playChunks();
          } else if (pendingTextRef.current) {
            // ElevenLabs TTS failed — use browser speech synthesis as fallback
            speakWithBrowserTTS(pendingTextRef.current);
          }
          pendingTextRef.current = null;
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
    [audio, speakWithBrowserTTS],
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
    (partNumber: number, questionId: number, text: string) => {
      send({ type: 'transcript', partNumber, questionId, text });
      setExamState('PROCESSING');
    },
    [send],
  );

  const startSpeakingPart2 = useCallback(() => {
    send({ type: 'start_speaking_part2' });
    setExamState('PART2_SPEAKING');
  }, [send]);

  const stopSpeakingPart2 = useCallback(
    (text: string) => send({ type: 'stop_speaking_part2', text }),
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

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  // ── Auto-transition AUDIO_PLAYING -> RECORDING ────────────
  useEffect(() => {
    if (examState === 'AUDIO_PLAYING' && !audio.isAudioPlaying) {
      setExamState('RECORDING');
    }
  }, [examState, audio.isAudioPlaying]);

  return {
    examState,
    currentQuestion,
    cueCard,
    evaluation,
    error,
    isWsConnected,
    isAudioPlaying: audio.isAudioPlaying,
    connect,
    startExam,
    sendTranscript,
    startSpeakingPart2,
    stopSpeakingPart2,
    endExam,
    disconnect,
  };
}
