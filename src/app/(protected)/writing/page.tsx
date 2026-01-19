'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWritingStore } from '@/store/writing-store';
import { WritingEditor } from '@/components/writing/writing-editor';
import { GradingModal } from '@/components/writing/grading-modal';
import { FileText, Send } from 'lucide-react';

const MOCK_TASK = {
  title: 'IELTS Writing Task 2',
  prompt:
    'Some people believe that studying at university or college is the best route to a successful career, while others believe that it is better to get a job straight after school. Discuss both views and give your opinion.',
  minWords: 250,
};

export default function WritingPage() {
  const { wordCount, gradingResult, submitForGrading } = useWritingStore();
  const [showGrading, setShowGrading] = useState(false);

  const handleSubmit = () => {
    submitForGrading();
    setShowGrading(true);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            {MOCK_TASK.title}
          </h1>
        </div>

        {/* Stats Bar */}
        <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-gray-600">Số từ</p>
              <p className="text-xl font-bold">{wordCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tối thiểu</p>
              <p className="text-xl font-bold text-gray-400">{MOCK_TASK.minWords}</p>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={wordCount < MOCK_TASK.minWords}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Nộp bài
          </Button>
        </div>

        {/* Editor */}
        <WritingEditor taskPrompt={MOCK_TASK.prompt} />

        {/* Grading Modal */}
        {gradingResult && (
          <GradingModal
            isOpen={showGrading}
            onClose={() => setShowGrading(false)}
            result={gradingResult}
          />
        )}
      </div>
    </div>
  );
}
