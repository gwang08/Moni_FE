'use client';

import { useState, useRef, useCallback } from 'react';

// Hook that records audio from the user's microphone during a Daily.co call.
// MediaRecorder captures the local mic stream (not remote participants).
// This is a deliberate trade-off — the user's speaking is what matters for IELTS assessment.
export function useCallRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      // Request mic separately — browser may share with Daily.co iframe
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Check supported mimeType
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        console.log(`Recording stopped: ${chunksRef.current.length} chunks, ${blob.size} bytes`);
        if (blob.size > 0) {
          setRecordingBlob(blob);
        } else {
          console.warn('Recording blob is empty — mic may have been blocked');
        }
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      console.log('Recording started with mimeType:', recorder.mimeType);
    } catch (e) {
      console.error('Recording failed — mic permission denied or unavailable:', e);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return { startRecording, stopRecording, recordingBlob, isRecording };
}
