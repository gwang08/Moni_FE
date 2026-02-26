'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WritingEditor } from '@/components/writing/writing-editor';
import { GradingModal } from '@/components/writing/grading-modal';
import { useWritingStore } from '@/store/writing-store';
import { usePracticeStore } from '@/store/practice-store';
import { useTestDetail } from '@/hooks/use-test-detail';

const FALLBACK_PROMPT = 'Hãy viết một bài luận bày tỏ quan điểm của bạn về chủ đề được đề cập.';

interface Props {
  params: Promise<{ id: string }>;
}

export default function WritingExercisePage({ params }: Props) {
  const { id } = use(params);
  const { testDetail, loading, error } = useTestDetail(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);
  const { wordCount, submitForGrading, gradingResult } = useWritingStore();
  const [showGrading, setShowGrading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
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
  const prompt = stimuli?.content || testDetail.description || FALLBACK_PROMPT;
  const minWords = 250;

  const handleSubmit = () => {
    submitForGrading();
    setShowGrading(true);
  };

  const handleComplete = () => {
    markCompleted(id);
    setShowGrading(false);
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
              <p className="text-sm text-muted-foreground">{wordCount} / {minWords} từ</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={wordCount < minWords}>Chấm điểm</Button>
            <Button onClick={() => markCompleted(id)} variant="outline">Hoàn thành</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl p-6">
        <WritingEditor taskPrompt={prompt} />
      </div>

      {gradingResult && (
        <GradingModal isOpen={showGrading} onClose={handleComplete} result={gradingResult} />
      )}
    </div>
  );
}
