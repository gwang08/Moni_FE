'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye, Mic, MicOff } from 'lucide-react';
import type { QuestionEvent } from '@/types/speaking-exam.types';
import type { RecordingMode } from './exam-guide-screen';
import { ExamHintPanel } from './exam-hint-panel';

interface Props {
  question: QuestionEvent;
  isAudioPlaying: boolean;
  isListening: boolean;
  showQuestionAlways: boolean;
  onSubmitAnswer: () => void;
  recordingMode: RecordingMode;
  onManualStartMic: () => void;
  onManualStopMic: () => void;
  hintText?: string | null;
}

export function ExamQuestionDisplay({
  question,
  isAudioPlaying,
  isListening,
  showQuestionAlways,
  onSubmitAnswer,
  recordingMode,
  onManualStartMic,
  onManualStopMic,
  hintText,
}: Props) {
  const [showQuestion, setShowQuestion] = useState(showQuestionAlways);
  const [timeLeft, setTimeLeft] = useState(45); // 45s per question
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isManual = recordingMode === 'manual';

  // Reset state when question changes
  useEffect(() => {
    setShowQuestion(showQuestionAlways);
    setTimeLeft(45);

    // Only start countdown in auto mode
    if (!isManual) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            onSubmitAnswer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question.questionId, showQuestionAlways, onSubmitAnswer, isManual]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const waitingForMic = isManual && !isAudioPlaying && !isListening;
  const manualRecording = isManual && isListening;

  const questionCard = (
    <div className="relative flex min-h-[60vh] flex-1 flex-col rounded-lg border border-gray-200 bg-white">
      {/* Part header */}
      <div className="border-b border-gray-100 bg-[#f0f7ff] py-4 text-center">
        <h2 className="text-lg font-bold text-blue-700">Part {question.partNumber}</h2>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        {/* Audio playing indicator */}
        {isAudioPlaying && (
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm text-gray-500">AI is speaking...</span>
          </div>
        )}

        {/* Show question toggle or always-visible question */}
        {showQuestion ? (
          <div className="max-w-lg text-center">
            <p className="text-lg leading-relaxed text-[#2d3748]">{question.text}</p>
          </div>
        ) : (
          <button
            onClick={() => setShowQuestion(true)}
            className="flex items-center gap-2 text-blue-600 transition-colors hover:text-blue-800"
          >
            <Eye className="h-5 w-5" />
            <span className="font-medium">Show question</span>
          </button>
        )}

        {/* Manual mode: waiting for user to click mic */}
        {waitingForMic && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500">Bấm nút bên dưới để bắt đầu trả lời</p>
            <button
              onClick={onManualStartMic}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:bg-green-600 hover:shadow-xl active:scale-95"
              title="Bắt đầu nói"
            >
              <Mic className="h-7 w-7" />
            </button>
          </div>
        )}

        {/* Manual mode: recording, show stop button */}
        {manualRecording && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-sm text-gray-500">Đang ghi âm...</span>
            </div>
            <button
              onClick={onManualStopMic}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-600 hover:shadow-xl active:scale-95"
              title="Dừng nói"
            >
              <MicOff className="h-7 w-7" />
            </button>
          </div>
        )}

        {/* Auto mode: Listening indicator */}
        {!isManual && isListening && (
          <div className="mt-8 flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm text-gray-500">Listening...</span>
          </div>
        )}
      </div>

      {/* Timer at bottom — hidden in manual mode */}
      {!isManual && (
        <div className="flex justify-center border-t border-gray-100 py-4">
          <div
            className={`flex items-center gap-2 rounded-full border px-6 py-2 ${
              timeLeft <= 10
                ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-red-200 bg-red-50/50 text-red-500'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded bg-red-400" />
            <span className="text-sm font-medium">Time limit {formatTime(timeLeft)}</span>
          </div>
        </div>
      )}
    </div>
  );

  if (hintText) {
    return (
      <div className="flex gap-4 items-start">
        {questionCard}
        <ExamHintPanel hintText={hintText} />
      </div>
    );
  }

  return questionCard;
}
