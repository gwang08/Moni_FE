import { useRef, useState, useCallback, useEffect } from 'react';

// Check if browser supports Web Speech API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBrowserSpeechRecognition(): any | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/**
 * Browser built-in STT + MediaRecorder hook to capture answer audio.
 */
export function useBrowserSTT() {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // Web Speech API ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // MediaRecorder refs to capture audio blob
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const resolveBlobRef = useRef<((blob: Blob | null) => void) | null>(null);

  const stopListening = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // 1. Stop SpeechRecognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      // 2. Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        resolveBlobRef.current = resolve; // Will be called in onstop
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }

      // 3. Cleanup stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      setIsListening(false);
    });
  }, []);

  const startListening = useCallback(async () => {
    // Force cleanup before starting
    if (recognitionRef.current || mediaRecorderRef.current) {
      await stopListening();
    }
    
    setTranscript('');
    setInterimTranscript('');
    audioChunksRef.current = [];

    const SpeechRecognitionClass = getBrowserSpeechRecognition();
    if (!SpeechRecognitionClass) {
      console.error('[STT] Web Speech API not supported in this browser');
      return;
    }

    try {
      // Get mic stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup MediaRecorder
      try {
        let mimeType = '';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
        
        const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: actualMimeType });
          audioChunksRef.current = [];
          if (resolveBlobRef.current) {
            resolveBlobRef.current(blob);
            resolveBlobRef.current = null;
          }
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(1000); // chunk every second
      } catch (err) {
        console.warn('Could not initialize MediaRecorder:', err);
      }

      // Setup Web Speech API
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        
        if (finalText) {
          setTranscript((prev) => (prev ? prev + ' ' + finalText : finalText));
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        console.error('[STT] Web Speech API error:', event.error);
      };

      recognition.onend = () => {
        // Auto-restart if we are still meant to be listening
        if (recognitionRef.current) {
          try { recognition.start(); } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      
    } catch (err) {
      console.error('[STT] Failed to start listening:', err);
      stopListening();
    }
  }, [stopListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const combinedTranscript = (transcript + (transcript && interimTranscript ? ' ' : '') + interimTranscript).trim();

  return { transcript: combinedTranscript, isListening, startListening, stopListening };
}
