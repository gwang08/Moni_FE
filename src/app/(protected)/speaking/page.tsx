'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSpeakingStore } from '@/store/speaking-store';
import { VoiceRecorder } from '@/components/speaking/voice-recorder';
import { FeedbackDisplay } from '@/components/speaking/feedback-display';
import { MessageSquare, Send } from 'lucide-react';
import type { SpeakingFeedback } from '@/types/speaking.types';

const MOCK_TASK = {
  id: 'task_1',
  part: 1 as const,
  title: 'IELTS Speaking Part 1',
  question: 'Tell me about your hometown. What do you like most about living there?',
  speakTime: 120,
};

export default function SpeakingPage() {
  const { currentRecording, addFeedback } = useSpeakingStore();
  const [showFeedback, setShowFeedback] = useState(false);

  const handleGetFeedback = () => {
    if (!currentRecording) return;

    const mockFeedback: SpeakingFeedback = {
      fluency: 7.0,
      pronunciation: 6.5,
      vocabulary: 7.5,
      grammar: 7.0,
      overallScore: 7.0,
      comments:
        'Bạn đã trả lời câu hỏi một cách mạch lạc và dễ hiểu. Khả năng sử dụng từ vựng tốt, tuy nhiên cần cải thiện thêm về phát âm một số từ khó.',
    };

    addFeedback(currentRecording.id, mockFeedback);
    setShowFeedback(true);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          {MOCK_TASK.title}
        </h1>

        {/* Question Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="font-bold text-lg mb-2">Câu hỏi</h2>
          <p className="text-gray-700">{MOCK_TASK.question}</p>
          <p className="text-sm text-gray-500 mt-2">
            Thời gian nói: {MOCK_TASK.speakTime} giây
          </p>
        </div>

        {/* Voice Recorder */}
        <VoiceRecorder taskId={MOCK_TASK.id} maxDuration={MOCK_TASK.speakTime} />

        {/* Transcript */}
        {currentRecording?.transcript && !showFeedback && (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold mb-3">Phiên âm</h3>
            <p className="text-gray-700 italic mb-4">{currentRecording.transcript}</p>
            <Button onClick={handleGetFeedback} className="gap-2">
              <Send className="h-4 w-4" />
              Nhận đánh giá
            </Button>
          </div>
        )}

        {/* Feedback */}
        {showFeedback && currentRecording?.feedback && (
          <FeedbackDisplay feedback={currentRecording.feedback} />
        )}
      </div>
    </div>
  );
}
