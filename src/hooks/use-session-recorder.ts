'use client';

import { useState, useRef, useEffect } from 'react';
import type { ExamState, QuestionEvent, CueCardEvent } from '@/types/speaking-exam.types';

export interface RecordedAnswer {
  part: number;
  questionText: string;
  transcript: string;
  audioUrl: string;
}

export function useSessionRecorder(
  examState: ExamState,
  currentQuestion: QuestionEvent | null,
  cueCard: CueCardEvent | null,
  currentTranscript: string
) {
  const [recordings, setRecordings] = useState<RecordedAnswer[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingContextRef = useRef<{ part: number; questionText: string } | null>(null);
  const transcriptRef = useRef<string>('');

  // Always keep transcriptRef up to date
  useEffect(() => {
    transcriptRef.current = currentTranscript;
  }, [currentTranscript]);

  useEffect(() => {
    if (examState === 'RECORDING' || examState === 'PART2_SPEAKING') {
      const part = examState === 'PART2_SPEAKING' ? 2 : currentQuestion?.partNumber || 1;
      const questionText = examState === 'PART2_SPEAKING'
        ? cueCard?.topic || 'Part 2 Cue Card'
        : currentQuestion?.text || '';

      recordingContextRef.current = { part, questionText };

      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        streamRef.current = stream;

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

        const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        chunksRef.current = [];

        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const ctx = recordingContextRef.current;

          if (ctx && blob.size > 0) {
            setRecordings((prev) => [
              ...prev,
              {
                part: ctx.part,
                questionText: ctx.questionText,
                transcript: transcriptRef.current || '[Không nhận diện được giọng nói]',
                audioUrl: url,
              },
            ]);
          }
        };

        mr.start(500);
        mediaRecorderRef.current = mr;
      }).catch((e) => {
        console.error('Failed to start session recorder:', e);
      });
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }
  }, [examState]); // Only trigger when examState changes
  
  return recordings;
}
