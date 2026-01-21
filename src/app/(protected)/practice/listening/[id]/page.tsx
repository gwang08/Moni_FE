'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getExerciseById } from '@/data/exercises';
import { AudioPlayer } from '@/components/listening/audio-player';
import { TranscriptView } from '@/components/listening/transcript-view';
import { usePracticeStore } from '@/store/practice-store';
import type { TranscriptSegment } from '@/types/listening.types';

const MOCK_TRANSCRIPTS: Record<string, TranscriptSegment[]> = {
  'listening-1': [
    { id: '1', startTime: 0, endTime: 4, text: "Hello, I'm calling about student accommodation." },
    { id: '2', startTime: 4, endTime: 8, text: 'Yes, how can I help you today?' },
    { id: '3', startTime: 8, endTime: 13, text: "I'd like to know about the halls of residence for next year." },
    { id: '4', startTime: 13, endTime: 18, text: 'Certainly. We have several options available.' },
    { id: '5', startTime: 18, endTime: 23, text: 'The first option is single rooms with shared bathrooms.' },
    { id: '6', startTime: 23, endTime: 28, text: 'These are the most affordable at 500 pounds per month.' },
  ],
  'listening-2': [
    { id: '1', startTime: 0, endTime: 5, text: 'Good morning, welcome to Sunshine Travel Agency.' },
    { id: '2', startTime: 5, endTime: 10, text: "Hi, I'm interested in booking a holiday package." },
    { id: '3', startTime: 10, endTime: 15, text: 'Of course! What destination are you considering?' },
    { id: '4', startTime: 15, endTime: 20, text: "I'm thinking about somewhere in Southeast Asia." },
    { id: '5', startTime: 20, endTime: 25, text: 'Thailand and Vietnam are very popular choices.' },
    { id: '6', startTime: 25, endTime: 30, text: 'Both offer excellent value for money.' },
  ],
  'listening-3': [
    { id: '1', startTime: 0, endTime: 6, text: "Today we'll discuss renewable energy sources." },
    { id: '2', startTime: 6, endTime: 12, text: 'Solar and wind power have grown significantly.' },
    { id: '3', startTime: 12, endTime: 18, text: 'These technologies are becoming more cost-effective.' },
    { id: '4', startTime: 18, endTime: 24, text: 'Government policies play a crucial role in adoption.' },
    { id: '5', startTime: 24, endTime: 30, text: 'Many countries have set ambitious targets.' },
    { id: '6', startTime: 30, endTime: 36, text: 'The transition to clean energy is accelerating.' },
  ],
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function ListeningExercisePage({ params }: Props) {
  const { id } = use(params);
  const exercise = getExerciseById(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);

  if (!exercise || exercise.skill !== 'listening') {
    notFound();
  }

  const transcript = MOCK_TRANSCRIPTS[id] || MOCK_TRANSCRIPTS['listening-1'];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b p-4">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/practice">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{exercise.title}</h1>
              <p className="text-sm text-muted-foreground">
                Thời lượng: {formatDuration(exercise.duration || 0)} •{' '}
                {exercise.questionCount} câu hỏi
              </p>
            </div>
          </div>
          <Button onClick={() => markCompleted(id)}>Hoàn thành</Button>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl p-6 space-y-6">
        <AudioPlayer audioUrl="/audio/sample.mp3" />
        <TranscriptView segments={transcript} />
      </div>
    </div>
  );
}
