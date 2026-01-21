'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getExerciseById } from '@/data/exercises';
import { VoiceRecorder } from '@/components/speaking/voice-recorder';
import { FeedbackDisplay } from '@/components/speaking/feedback-display';
import { usePracticeStore } from '@/store/practice-store';
import { useSpeakingStore } from '@/store/speaking-store';
import type { SpeakingFeedback } from '@/types/speaking.types';

const MOCK_PROMPTS: Record<string, { question: string; prepTime: number; speakTime: number }> = {
  'speaking-1': {
    question:
      'Describe a person who has influenced you in your life. You should say: Who this person is, How you know them, What influence they had on you, And explain why this person is important to you.',
    prepTime: 60,
    speakTime: 120,
  },
  'speaking-2': {
    question:
      'Describe a place you like to visit. You should say: Where it is, How often you go there, What you do there, And explain why you like this place.',
    prepTime: 60,
    speakTime: 120,
  },
  'speaking-3': {
    question:
      'Talk about your future career plans. You should say: What career you want to pursue, Why you chose this career, What steps you need to take, And explain how this career will benefit you.',
    prepTime: 60,
    speakTime: 120,
  },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function SpeakingExercisePage({ params }: Props) {
  const { id } = use(params);
  const exercise = getExerciseById(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);
  const { currentRecording, addFeedback } = useSpeakingStore();

  if (!exercise || exercise.skill !== 'speaking') {
    notFound();
  }

  const prompt = MOCK_PROMPTS[id] || MOCK_PROMPTS['speaking-1'];

  const handleGetFeedback = () => {
    if (!currentRecording) return;

    const mockFeedback: SpeakingFeedback = {
      fluency: 6.5,
      pronunciation: 7.0,
      vocabulary: 6.5,
      grammar: 6.0,
      overallScore: 6.5,
      comments: 'Bạn đã trả lời tốt câu hỏi. Hãy cải thiện độ trôi chảy và sử dụng thêm từ vựng đa dạng.',
    };

    addFeedback(currentRecording.id, mockFeedback);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b p-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/practice">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{exercise.title}</h1>
              <p className="text-sm text-muted-foreground">Speaking Part 2</p>
            </div>
          </div>
          <Button onClick={() => markCompleted(id)}>Hoàn thành</Button>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl p-6 space-y-6">
        {/* Question card */}
        <div className="bg-white border rounded-lg p-6">
          <p className="text-muted-foreground mb-4">{prompt.question}</p>
          <div className="flex gap-4 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
              Chuẩn bị: {prompt.prepTime}s
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded">
              Nói: {prompt.speakTime}s
            </span>
          </div>
        </div>

        {/* Recorder */}
        <VoiceRecorder taskId={id} maxDuration={prompt.speakTime} />

        {/* Feedback section */}
        {currentRecording && !currentRecording.feedback && (
          <Button onClick={handleGetFeedback} className="w-full">
            Nhận đánh giá
          </Button>
        )}

        {currentRecording?.feedback && (
          <FeedbackDisplay feedback={currentRecording.feedback} />
        )}
      </div>
    </div>
  );
}
