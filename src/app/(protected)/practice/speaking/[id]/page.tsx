'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceRecorder } from '@/components/speaking/voice-recorder';
import { FeedbackDisplay } from '@/components/speaking/feedback-display';
import { usePracticeStore } from '@/store/practice-store';
import { useSpeakingStore } from '@/store/speaking-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import type { SpeakingFeedback } from '@/types/speaking.types';

const DEFAULT_PREP_TIME = 60;
const DEFAULT_SPEAK_TIME = 120;
const FALLBACK_QUESTION = 'Hãy trả lời câu hỏi theo chủ đề được giao. Sử dụng ngôn ngữ tự nhiên và rõ ràng.';

interface Props {
  params: Promise<{ id: string }>;
}

export default function SpeakingExercisePage({ params }: Props) {
  const { id } = use(params);
  const { testDetail, loading, error } = useTestDetail(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);
  const { currentRecording, addFeedback } = useSpeakingStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
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
  const question = stimuli?.content || testDetail.description || FALLBACK_QUESTION;

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
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{testDetail.title}</h1>
              <p className="text-sm text-muted-foreground">Speaking Part 2</p>
            </div>
          </div>
          <Button onClick={() => markCompleted(id)}>Hoàn thành</Button>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl p-6 space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <p className="text-muted-foreground mb-4">{question}</p>
          <div className="flex gap-4 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">Chuẩn bị: {DEFAULT_PREP_TIME}s</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded">Nói: {DEFAULT_SPEAK_TIME}s</span>
          </div>
        </div>

        <VoiceRecorder taskId={id} maxDuration={DEFAULT_SPEAK_TIME} />

        {currentRecording && !currentRecording.feedback && (
          <Button onClick={handleGetFeedback} className="w-full">Nhận đánh giá</Button>
        )}

        {currentRecording?.feedback && (
          <FeedbackDisplay feedback={currentRecording.feedback} />
        )}
      </div>
    </div>
  );
}
