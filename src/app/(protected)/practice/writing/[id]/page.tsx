'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getExerciseById } from '@/data/exercises';
import { WritingEditor } from '@/components/writing/writing-editor';
import { GradingModal } from '@/components/writing/grading-modal';
import { useWritingStore } from '@/store/writing-store';
import { usePracticeStore } from '@/store/practice-store';

const MOCK_PROMPTS: Record<string, string> = {
  'writing-1':
    'Some people think that the best way to improve public health is by increasing the number of sports facilities. Others, however, believe that this would have little effect on public health and that other measures are required. Discuss both views and give your own opinion.',
  'writing-2':
    'In many countries, online learning has become increasingly popular. Some people believe that online education will eventually replace traditional classroom teaching. To what extent do you agree or disagree?',
  'writing-3':
    "Some people think that individuals are responsible for protecting the environment, while others believe it is the government's responsibility. Discuss both views and give your opinion.",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function WritingExercisePage({ params }: Props) {
  const { id } = use(params);
  const exercise = getExerciseById(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);
  const { wordCount, submitForGrading, gradingResult } = useWritingStore();
  const [showGrading, setShowGrading] = useState(false);

  if (!exercise || exercise.skill !== 'writing') {
    notFound();
  }

  const prompt = MOCK_PROMPTS[id] || MOCK_PROMPTS['writing-1'];
  const minWords = exercise.minWords || 250;

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
      {/* Header */}
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
              <p className="text-sm text-muted-foreground">
                {wordCount} / {minWords} từ
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={wordCount < minWords}
            >
              Chấm điểm
            </Button>
            <Button onClick={() => markCompleted(id)} variant="outline">
              Hoàn thành
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl p-6">
        <WritingEditor taskPrompt={prompt} />
      </div>

      {/* Grading Modal */}
      {gradingResult && (
        <GradingModal
          isOpen={showGrading}
          onClose={handleComplete}
          result={gradingResult}
        />
      )}
    </div>
  );
}
