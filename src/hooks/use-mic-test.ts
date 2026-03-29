import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Hook for testing microphone — records up to `maxDuration` seconds,
 * then provides a playback URL.
 */
export function useMicTest(maxDuration = 20) {
  const [isRecording, setIsRecording] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    cleanup();

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    // Clean up previous
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setHasRecorded(false);
    setRecordingTime(0);
    setError(null);
    chunksRef.current = [];
    setIsRequestingMic(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRequestingMic(false);

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setHasRecorded(true);
      };

      recorder.start();
      setIsRecording(true);

      // Timer counting up
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Auto-stop after maxDuration
      maxTimerRef.current = setTimeout(() => {
        stopRecording();
      }, maxDuration * 1000);
    } catch (err: unknown) {
      setIsRequestingMic(false);
      console.error('[MicTest] Failed to access microphone:', err);

      const error = err as DOMException;
      if (error.name === 'NotFoundError') {
        setError(
          'No microphone found on your device. Please connect a microphone and try again.',
        );
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError(
          'Microphone permission denied. Please allow microphone access in your browser settings and try again.',
        );
      } else {
        setError(
          'Cannot access microphone. Please check your device and browser settings.',
        );
      }
    }
  }, [audioUrl, maxDuration, stopRecording]);

  const reset = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setHasRecorded(false);
    setRecordingTime(0);
    setError(null);
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cleanup]);

  return {
    isRecording,
    isRequestingMic,
    recordingTime,
    audioUrl,
    hasRecorded,
    error,
    startRecording,
    stopRecording,
    reset,
  };
}
