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

// Check if browser supports Web Speech API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBrowserSpeechRecognition(): any | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/**
 * Realtime Speech-to-Text hook.
 * 
 * Strategy:
 *   1. Try AssemblyAI (via backend proxy token) — best quality
 *   2. Fallback to Web Speech API (browser built-in) — free, works on Chrome/Edge
 */
export function useAssemblyAISTT() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // AssemblyAI refs
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Web Speech API ref (fallback)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const usingFallbackRef = useRef(false);

  const stopListening = useCallback(() => {
    // Stop AssemblyAI resources
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

    // Stop Web Speech API
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore if already stopped
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
  }, []);

  // ── Fallback: Web Speech API (browser built-in) ────────────
  const startWebSpeechFallback = useCallback(() => {
    const SpeechRecognitionClass = getBrowserSpeechRecognition();
    if (!SpeechRecognitionClass) {
      console.error('[STT] Web Speech API not supported in this browser');
      return;
    }

    console.log('[STT] Using Web Speech API fallback (free, browser built-in)');
    usingFallbackRef.current = true;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
      if (finalText) {
        setTranscript((prev) => (prev ? prev + ' ' + finalText : finalText));
      }
    };

    recognition.onerror = (event: any) => {
      // "no-speech" is normal, ignore it
      if (event.error === 'no-speech') return;
      console.error('[STT] Web Speech API error:', event.error);
    };

    recognition.onend = () => {
      // Restart if still supposed to be listening (Web Speech API auto-stops)
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      console.error('[STT] Failed to start Web Speech API:', err);
    }
  }, []);

  // ── Primary: AssemblyAI STT ────────────────────────────────
  const startListening = useCallback(async () => {
    stopListening();
    setTranscript('');
    usingFallbackRef.current = false;

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

      if (!tokenRes.ok) {
        console.warn('[STT] AssemblyAI token failed (status=' + tokenRes.status + '), falling back to Web Speech API');
        startWebSpeechFallback();
        return;
      }

      const data = await tokenRes.json();
      if (!data.token) {
        console.warn('[STT] AssemblyAI returned no token, falling back to Web Speech API');
        startWebSpeechFallback();
        return;
      }

      // 2. Connect to AssemblyAI realtime WS
      const ws = new WebSocket(
        `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${data.token}`,
      );

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.message_type === 'FinalTranscript' && msg.text) {
            setTranscript((prev) => (prev ? prev + ' ' + msg.text : msg.text));
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        console.error('[STT] AssemblyAI WebSocket error');
        stopListening();
      };

      ws.onopen = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioCtx({ sampleRate: 16000 });
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
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              ws.send(pcmData.buffer);
            }
          };

          source.connect(processor);
          processor.connect(audioContext.destination);
          setIsListening(true);
        } catch (err) {
          console.error('[STT] Mic access denied:', err);
          ws.close();
        }
      };

      socketRef.current = ws;
    } catch (err) {
      console.warn('[STT] AssemblyAI failed, falling back to Web Speech API:', err);
      startWebSpeechFallback();
    }
  }, [stopListening, startWebSpeechFallback]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { transcript, isListening, startListening, stopListening };
}
