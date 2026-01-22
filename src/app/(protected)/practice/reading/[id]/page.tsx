'use client';

import { use, useEffect } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getExerciseById } from '@/data/exercises';
import { ReadingToolbar } from '@/components/reading/reading-toolbar';
import { ReadingPassage } from '@/components/reading/reading-passage';
import { NotesSidebar } from '@/components/reading/notes-sidebar';
import { usePracticeStore } from '@/store/practice-store';
import { useReadingStore } from '@/store/reading-store';

// Mock passages for each exercise
const MOCK_PASSAGES: Record<string, { title: string; content: string }> = {
  'reading-1': {
    title: 'The History of Coffee',
    content: `Coffee is one of the most popular beverages in the world. Its origins can be traced back to Ethiopia, where legend has it that a goat herder named Kaldi discovered coffee beans after noticing his goats became energetic after eating them.

The cultivation of coffee spread to the Arabian Peninsula, where it became an integral part of social and cultural life. By the 15th century, coffee was being grown in Yemen, and coffee houses began to appear in cities across the Middle East.

Today, coffee is grown in over 70 countries, with Brazil being the largest producer. The coffee industry provides livelihoods for millions of people worldwide.`,
  },
  'reading-2': {
    title: 'Climate Change Effects',
    content: `Climate change represents one of the most pressing challenges facing our planet today. Rising global temperatures are causing significant changes to weather patterns, ecosystems, and human societies.

The effects of climate change are already visible in many parts of the world. Glaciers are melting at unprecedented rates, sea levels are rising, and extreme weather events are becoming more frequent and severe.

Scientists predict that without significant action to reduce greenhouse gas emissions, these impacts will continue to worsen, potentially leading to catastrophic consequences for both natural systems and human civilization.`,
  },
  'reading-3': {
    title: 'Urban Transportation',
    content: `The evolution of urban transportation has shaped the development of cities throughout history. From horse-drawn carriages to electric vehicles, each innovation has transformed how people move through urban spaces.

Public transportation systems, including buses, trams, and subways, have become essential components of modern city infrastructure. These systems help reduce traffic congestion, lower carbon emissions, and provide affordable mobility options for residents.

Looking ahead, cities are exploring new solutions such as autonomous vehicles, bike-sharing programs, and improved pedestrian infrastructure to create more sustainable and livable urban environments.`,
  },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function ReadingExercisePage({ params }: Props) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');

  const exercise = getExerciseById(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);
  const { mode, setMode, clearAll } = useReadingStore();

  // Set mode from URL params on mount
  useEffect(() => {
    if (modeParam === 'exam' || modeParam === 'practice') {
      setMode(modeParam);
    }
    // Clear highlights when changing exercises
    clearAll();
  }, [modeParam, setMode, clearAll]);

  if (!exercise || exercise.skill !== 'reading') {
    notFound();
  }

  const passage = MOCK_PASSAGES[id] || MOCK_PASSAGES['reading-1'];

  const handleComplete = () => {
    markCompleted(id);
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/practice">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{exercise.title}</h1>
              <Badge
                variant="outline"
                className={
                  mode === 'exam'
                    ? 'bg-orange-100 text-orange-700 border-orange-300'
                    : 'bg-blue-100 text-blue-700 border-blue-300'
                }
              >
                {mode === 'exam' ? (
                  <>
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Thi thử
                  </>
                ) : (
                  <>
                    <BookMarked className="h-3 w-3 mr-1" />
                    Luyện tập
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {exercise.questionCount} câu hỏi
            </p>
          </div>
        </div>
        <Button onClick={handleComplete}>Hoàn thành</Button>
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
