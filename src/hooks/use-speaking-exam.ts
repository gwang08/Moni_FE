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

  // ── Message handler ───────────────────────────────────────
  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'question':
          setCurrentQuestion(msg);
          audio.resetChunks();
          if (msg.partNumber === 1) setExamState('PART1_QUESTIONING');
          if (msg.partNumber === 3) setExamState('PART3_QUESTIONING');
          break;

        case 'audio_chunk':
          audio.pushChunk(msg.data);
          break;

        case 'audio_end':
          audio.playChunks();
          break;

        case 'show_cue_card':
          setCueCard(msg);
          setExamState('PART2_PREPARATION');
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
          setExamState('ERROR');
          break;
      }
    },
    [audio],
  );

  // ── Connect ───────────────────────────────────────────────
  const connect = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      setError('Không tìm thấy token xác thực');
      setExamState('ERROR');
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
      setError('Mất kết nối WebSocket');
      setExamState('ERROR');
    };

    ws.onclose = () => {
      console.log('[SpeakingExam] WS closed');
      setIsWsConnected(false);
    };

    wsRef.current = ws;
  }, [handleMessage]);

  // ── Actions ───────────────────────────────────────────────
  const startExam = useCallback(
    (testId: number) => send({ type: 'start_exam', testId }),
    [send],
  );

  const sendTranscript = useCallback(
    (partNumber: number, questionId: number, text: string) =>
      send({ type: 'transcript', partNumber, questionId, text }),
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
