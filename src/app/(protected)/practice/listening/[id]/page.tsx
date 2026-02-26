'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/listening/audio-player';
import { TranscriptView } from '@/components/listening/transcript-view';
import { usePracticeStore } from '@/store/practice-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import type { TranscriptSegment } from '@/types/listening.types';

const MOCK_TRANSCRIPTS: Record<string, TranscriptSegment[]> = {
  'listening-1': [
    { id: '1', startTime: 0, endTime: 4, text: "Hello, I'm calling about student accommodation." },
    { id: '2', startTime: 4, endTime: 8, text: 'Yes, how can I help you today?' },
    { id: '3', startTime: 8, endTime: 13, text: "I'd like to know about the halls of residence for next year." },
  ],
  'listening-2': [
    { id: '1', startTime: 0, endTime: 5, text: 'Good morning, welcome to Sunshine Travel Agency.' },
    { id: '2', startTime: 5, endTime: 10, text: "Hi, I'm interested in booking a holiday package." },
    { id: '3', startTime: 10, endTime: 15, text: 'Of course! What destination are you considering?' },
  ],
};

const DEFAULT_TRANSCRIPT: TranscriptSegment[] = [
  { id: '1', startTime: 0, endTime: 5, text: 'Transcript không khả dụng cho bài tập này.' },
];

interface Props {
  params: Promise<{ id: string }>;
}

export default function ListeningExercisePage({ params }: Props) {
  const { id } = use(params);
  const { testDetail, loading, error } = useTestDetail(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-3 text-gray-600">Đang tải bài tập...</span>
      </div>
    );
  }

  if (error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice"><Button variant="outline">Quay lại danh sách</Button></Link>
      </div>
    );
  }

  const stimuli = testDetail.stimuli[0];
  // Use API mediaUrl if available, otherwise fall back to sample
  const audioUrl = stimuli?.mediaUrl || '/audio/sample.mp3';
  const transcript = MOCK_TRANSCRIPTS[id] || DEFAULT_TRANSCRIPT;
  const questionCount = stimuli?.questions?.length ?? 0;

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
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{testDetail.title}</h1>
              <p className="text-sm text-muted-foreground">
                {questionCount > 0 && `${questionCount} câu hỏi`}
                {questionCount > 0 && ' • '}
                Thời lượng: {formatDuration(600)}
              </p>
            </div>
          </div>
          <Button onClick={() => markCompleted(id)}>Hoàn thành</Button>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl p-6 space-y-6">
        <AudioPlayer audioUrl={audioUrl} />
        <TranscriptView segments={transcript} />
      </div>
    </div>
  );
}
