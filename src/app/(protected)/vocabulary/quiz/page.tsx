'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizSetup } from '@/components/vocabulary/quiz-setup';
import { QuizQuestionCard } from '@/components/vocabulary/quiz-question-card';
import { QuizResult } from '@/components/vocabulary/quiz-result';
import { generateQuiz } from '@/lib/vocab-api';
import { getVocabQuiz, completeSlot } from '@/lib/roadmap-api';
import { QuizQuestion } from '@/types/vocab.types';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

type Screen = 'setup' | 'quiz' | 'result';

interface WrongAnswer {
  question: QuizQuestion;
  selectedIndex: number;
}

export default function QuizPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('setup');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [incorrectWords, setIncorrectWords] = useState<string[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    const slotIdx = searchParams.get('slotId');
    if (slotIdx && !initialized.current) {
      initialized.current = true;
      const sId = parseInt(slotIdx);
      setActiveSlotId(sId);
      loadRoadmapQuiz(sId);
    }
  }, [searchParams]);

  const loadRoadmapQuiz = async (slotId: number) => {
    setLoading(true);
    try {
      const res = await getVocabQuiz(slotId);
      if (!res || !res.questions.length) {
        toast.error('Không tìm thấy từ vựng cho bài kiểm tra này.');
        setScreen('setup');
        return;
      }
      setQuestions(res.questions);
      setCurrentIdx(0);
      setScore(0);
      setWrongAnswers([]);
      setCorrectWords([]);
      setIncorrectWords([]);
      setScreen('quiz');
    } catch (err) {
      toast.error('Lỗi khi tải bài thi từ vựng');
      setScreen('setup');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (params: {
    source: string;
    count: number;
    band?: string;
    topic?: string;
  }) => {
    setLoading(true);
    try {
      const res = await generateQuiz(params.count, params.source, undefined, params.band, params.topic);
      if (!res.questions.length) {
        toast.error('Không đủ từ vựng để tạo quiz. Hãy thêm từ hoặc đổi nguồn.');
        return;
      }
      setQuestions(res.questions);
      setCurrentIdx(0);
      setScore(0);
      setWrongAnswers([]);
      setCorrectWords([]);
      setIncorrectWords([]);
      setScreen('quiz');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (selectedIndex: number) => {
    const question = questions[currentIdx];
    
    // Track correct and incorrect words
    const isCorrect = selectedIndex === question.correctIndex;
    const finalCorrectWords = isCorrect
        ? [...correctWords, question.word] 
        : correctWords;
    const finalIncorrectWords = !isCorrect
        ? [...incorrectWords, question.word]
        : incorrectWords;

    if (isCorrect) {
      setScore((s) => s + 1);
      setCorrectWords(finalCorrectWords);
    } else {
      setWrongAnswers((prev) => [...prev, { question, selectedIndex }]);
      setIncorrectWords(finalIncorrectWords);
    }

    if (currentIdx + 1 >= questions.length) {
      setScreen('result');
      // If this was a roadmap test, mark it as complete with both correct + incorrect words
      if (activeSlotId) {
        completeSlot(
          activeSlotId,
          score + (isCorrect ? 1 : 0),
          questions.length,
          finalCorrectWords,
          finalIncorrectWords
        ).catch(() => console.error("Failed to complete vocab slot"));
      }
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const handleRetry = () => {
    setScreen('setup');
    setQuestions([]);
    setCurrentIdx(0);
    setScore(0);
    setWrongAnswers([]);
    setCorrectWords([]);
    setIncorrectWords([]);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold text-gray-900">Trắc nghiệm</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      )}

      {!loading && screen === 'setup' && (
        <QuizSetup onStart={handleStart} loading={loading} />
      )}

      {!loading && screen === 'quiz' && questions.length > 0 && (
        <QuizQuestionCard
          question={questions[currentIdx]}
          questionNumber={currentIdx + 1}
          totalQuestions={questions.length}
          onNext={handleNext}
        />
      )}

      {!loading && screen === 'result' && (
        <QuizResult
          score={score}
          total={questions.length}
          wrongAnswers={wrongAnswers}
          onRetry={handleRetry}
          onBack={() => router.push('/vocabulary')}
        />
      )}
    </div>
  );
}
