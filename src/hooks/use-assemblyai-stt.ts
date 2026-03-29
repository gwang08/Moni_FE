import { useRef, useState, useCallback, useEffect } from 'react';

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
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const stopListening = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    // Stop any existing session
    stopListening();
    setTranscript('');

    try {
      // 1. Get temporary token from backend proxy
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
        stopListening();
      };

      ws.onopen = async () => {
        try {
          // 3. Capture microphone
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          // 4. Downsample to 16kHz & S16LE PCM using AudioContext
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) {
             throw new Error("Web Audio API is not supported in this browser");
          }
          const audioContext = new AudioContextClass({ sampleRate: 16000 });
          audioContextRef.current = audioContext;

          const source = audioContext.createMediaStreamSource(stream);
          sourceRef.current = source;

          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              
              for (let i = 0; i < inputData.length; i++) {
                // Convert float to 16-bit PCM
                let s = Math.max(-1, Math.min(1, inputData[i]));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              ws.send(pcmData.buffer);
            }
          };

          source.connect(processor);
          processor.connect(audioContext.destination);

          setIsListening(true);
        } catch (err) {
          console.error('[STT] Mic access denied or Audio Context failed:', err);
          ws.close();
        }
      };

      socketRef.current = ws;
    } catch (err) {
      console.error('[STT] Failed to start:', err);
    }
  }, [stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { transcript, isListening, startListening, stopListening };
}
