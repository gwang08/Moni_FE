'use client';

import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ExamAudioIndicator } from './exam-audio-indicator';
import { ExamTranscriptLive } from './exam-transcript-live';
import type { QuestionEvent } from '@/types/speaking-exam.types';

interface Props {
  question: QuestionEvent;
  isAudioPlaying: boolean;
  isListening: boolean;
  transcript: string;
  onSubmitAnswer: () => void;
}

export function ExamQuestionDisplay({
  question,
  isAudioPlaying,
  isListening,
  transcript,
  onSubmitAnswer,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Part header */}
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">
          Part {question.partNumber}
        </span>
        {question.isFollowUp && (
          <span className="text-xs text-gray-500">Câu hỏi bổ sung</span>
        )}
      </div>

      {/* Question text */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6">
        <p className="text-lg leading-relaxed text-gray-800">
          {question.isFollowUp && <span className="mr-1 text-blue-500">↳</span>}
          {question.text}
        </p>
      </div>

      {/* Audio playing indicator */}
      <ExamAudioIndicator isPlaying={isAudioPlaying} />

      {/* STT active: show transcript + submit */}
      {!isAudioPlaying && (isListening || transcript) && (
        <div className="space-y-4">
          <ExamTranscriptLive text={transcript} isListening={isListening} />
          <Button onClick={onSubmitAnswer} className="gap-2" disabled={isAudioPlaying}>
            <Send className="h-4 w-4" />
            Gửi câu trả lời
          </Button>
        </div>
      )}
    </div>
  );
}
