import { useRef, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

/**
 * Realtime Speech-to-Text via AssemblyAI WebSocket.
 * Token is fetched from backend proxy (API key never exposed to client).
 */
export function useAssemblyAISTT() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startListening = useCallback(async () => {
    setTranscript('');

    try {
      // 1. Get temporary token from backend proxy (not directly from AssemblyAI)
      const authToken = getAuthToken();
      const tokenRes = await fetch(`${API_URL}/api/v1/assemblyai/token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!tokenRes.ok) throw new Error('Failed to get STT token');
      const { token } = await tokenRes.json();

      // 2. Connect to AssemblyAI realtime WS with temp token
      const ws = new WebSocket(
        `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`,
      );

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.message_type === 'FinalTranscript' && data.text) {
            setTranscript((prev) => (prev ? prev + ' ' + data.text : data.text));
          }
        } catch {
          // ignore parse errors from AssemblyAI
        }
      };

      ws.onerror = () => {
        console.error('[STT] WebSocket error');
        setIsListening(false);
      };

      ws.onopen = async () => {
        try {
          // 3. Capture microphone
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              event.data.arrayBuffer().then((buffer) => {
                ws.send(new Uint8Array(buffer));
              });
            }
          };

          recorder.start(250);
          recorderRef.current = recorder;
          setIsListening(true);
        } catch (err) {
          console.error('[STT] Mic access denied:', err);
          ws.close();
        }
      };

      socketRef.current = ws;
    } catch (err) {
      console.error('[STT] Failed to start:', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    socketRef.current?.close();
    socketRef.current = null;

    setIsListening(false);
  }, []);

  return { transcript, isListening, startListening, stopListening };
}
