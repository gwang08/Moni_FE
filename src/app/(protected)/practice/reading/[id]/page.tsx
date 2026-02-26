'use client';

import { use, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, BookMarked, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReadingToolbar } from '@/components/reading/reading-toolbar';
import { ReadingPassage } from '@/components/reading/reading-passage';
import { NotesSidebar } from '@/components/reading/notes-sidebar';
import { usePracticeStore } from '@/store/practice-store';
import { useReadingStore } from '@/store/reading-store';
import { useTestDetail } from '@/hooks/use-test-detail';

const FALLBACK_PASSAGE = {
  title: 'Bài đọc',
  content: 'Nội dung bài đọc đang được tải. Vui lòng thử lại sau.',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function ReadingExercisePage({ params }: Props) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');

  const { testDetail, loading, error } = useTestDetail(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);
  const { mode, setMode, clearAll } = useReadingStore();

  useEffect(() => {
    if (modeParam === 'exam' || modeParam === 'practice') {
      setMode(modeParam);
    }
    clearAll();
  }, [modeParam, setMode, clearAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Đang tải bài tập...</span>
      </div>
    );
  }

  if (error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice"><Button variant="outline">Quay lại danh sách</Button></Link>
      </div>
    );
  }

  const stimuli = testDetail.stimuli[0];
  const passage = stimuli?.content
    ? { title: testDetail.title, content: stimuli.content }
    : FALLBACK_PASSAGE;
  const questionCount = stimuli?.questions?.length ?? 0;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/practice">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{testDetail.title}</h1>
              <Badge variant="outline" className={mode === 'exam' ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-blue-100 text-blue-700 border-blue-300'}>
                {mode === 'exam' ? (<><GraduationCap className="h-3 w-3 mr-1" />Thi thử</>) : (<><BookMarked className="h-3 w-3 mr-1" />Luyện tập</>)}
              </Badge>
            </div>
            {questionCount > 0 && <p className="text-sm text-muted-foreground">{questionCount} câu hỏi</p>}
          </div>
        </div>
        <Button onClick={() => markCompleted(id)}>Hoàn thành</Button>
      </div>

      <ReadingToolbar />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-6">{passage.title}</h2>
          <ReadingPassage content={passage.content} />
        </div>
        <NotesSidebar />
      </div>
    </div>
  );
}
