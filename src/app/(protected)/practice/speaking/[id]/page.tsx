'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SpeakingPracticeHeader } from '@/components/speaking/speaking-practice-header';
import { SpeakingTopicSidebar } from '@/components/speaking/speaking-topic-sidebar';
import { SpeakingQuestionCenter } from '@/components/speaking/speaking-question-center';
import { SpeakingRecorder } from '@/components/speaking/speaking-recorder';
import { SpeakingFeedbackPanel } from '@/components/speaking/speaking-feedback-panel';
import { SpeakingNotesPanel } from '@/components/speaking/speaking-notes-panel';
import { useTestDetail } from '@/hooks/use-test-detail';
import { useSpeakingStore } from '@/store/speaking-store';
import { usePracticeStore } from '@/store/practice-store';
import { submitAttempt } from '@/lib/practice-api';

const FALLBACK_CONTENT = 'Hãy trả lời câu hỏi theo chủ đề được giao. Sử dụng ngôn ngữ tự nhiên và rõ ràng.';


interface Props {
  params: Promise<{ id: string }>;
}

export default function SpeakingPracticePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { testDetail, loading, error } = useTestDetail(id);

  const {
    currentQuestionIndex,
    notes,
    isScoring,
    scoringError,
    recordings,
    currentRecording,
    setCurrentQuestionIndex,
    setNotes,
    submitForScoring,
    reset,
  } = useSpeakingStore();

  const markCompleted = usePracticeStore((state) => state.markCompleted);

  const [showSample, setShowSample] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState<Record<string, Blob>>({});

  useEffect(() => {
    reset();
  }, [reset]);

  const questions = useMemo(() => {
    if (!testDetail) return [];

    // Aggregate questions from all stimuli (all Parts)
    const allQuestions: { id: number; content: string; position: number; sampleAnswer?: string; partNumber: number; questionCategory?: string }[] = [];

    for (const stimulus of testDetail.stimuli) {
      const section = stimulus.section ?? 1;
      for (const group of stimulus.questionGroups ?? []) {
        for (const q of group.questions ?? []) {
          // Skip transition scripts (position 0)
          if (q.position === 0) continue;
          // Skip Part 2 cue card in practice mode (it's shown differently in exam)
          // But keep it for Part 2 as it IS the question
          allQuestions.push({
            id: q.id,
            content: q.content || FALLBACK_CONTENT,
            position: q.position,
            sampleAnswer: q.explanation?.text,
            partNumber: section,
            questionCategory: q.questionCategory,
          });
        }
      }
    }

    // Sort by part number, then position
    allQuestions.sort((a, b) => a.partNumber - b.partNumber || a.position - b.position);

    if (allQuestions.length > 0) return allQuestions;

    // Fallback for old-format tests
    return [{
      id: 0,
      content: testDetail.stimuli[0]?.content || testDetail.description || FALLBACK_CONTENT,
      position: 1,
      sampleAnswer: undefined,
      partNumber: 1,
    }];
  }, [testDetail]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentPart = currentQuestion?.partNumber ?? testDetail?.section ?? 1;

  const completedIds = useMemo(() => {
    const ids = new Set<number>();
    recordings.forEach((r) => {
      const qId = parseInt(r.taskId.replace(`${id}-q`, ''), 10);
      if (!isNaN(qId)) ids.add(qId);
    });
    return ids;
  }, [recordings, id]);

  const taskId = currentQuestion ? `${id}-q${currentQuestion.id}` : id;

  const questionRecording = currentQuestion
    ? recordings.filter((r) => r.taskId === taskId).at(-1) ?? null
    : null;

  const lastRecordedBlob = taskId ? recordedBlobs[taskId] ?? null : null;

  const handleRecordingComplete = (blob: Blob) => {
    setRecordedBlobs((prev) => ({ ...prev, [taskId]: blob }));
  };

  const handleSubmitForScoring = async () => {
    if (!allRecorded) return;
    // Collect all recorded blobs in question order
    const orderedBlobs: Blob[] = [];
    for (const q of questions) {
      const blob = recordedBlobs[`${id}-q${q.id}`];
      if (blob && blob.size > 0) orderedBlobs.push(blob);
    }
    if (orderedBlobs.length === 0) return;

    // Use first blob's mime type
    const mimeType = orderedBlobs[0].type || 'audio/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

    // If only 1 recording, send directly; otherwise merge
    const finalBlob = orderedBlobs.length === 1
      ? orderedBlobs[0]
      : new Blob(orderedBlobs, { type: mimeType });
    const file = new File([finalBlob], `speaking-full.${ext}`, { type: mimeType });

    // Build all questions as context
    const allQuestions = questions.map((q) => `Part ${q.partNumber} Q${q.position}: ${q.content}`).join('\n');
    await submitForScoring(file, allQuestions);
    // Save attempt to history after scoring
    await saveProgress();
  };

  const saveProgress = async () => {
    if (!testDetail || questions.length === 0) return;
    markCompleted(id);
    const stimulus = testDetail.stimuli[0];
    if (stimulus) {
      try {
        const answers = questions
          .filter((q) => recordedBlobs[`${id}-q${q.id}`])
          .map((q) => {
            // Use feedback transcript if available, otherwise mark as recorded
            const rec = recordings.find((r) => r.taskId === `${id}-q${q.id}`);
            const transcript = rec?.feedback?.comments || '[Đã ghi âm]';
            return { questionId: q.id, answerText: transcript };
          });
        if (answers.length > 0) {
          await submitAttempt({
            testId: Number(id),
            stimulusId: stimulus.id,
            elapsedSeconds: 0,
            answers,
          });
        }
      } catch { /* ignore */ }
    }
  };

  const allRecorded = questions.length > 0 && questions.every((q) => recordedBlobs[`${id}-q${q.id}`]);

  const handleExit = () => setShowExitDialog(true);
  const handleConfirmExit = () => router.push('/practice?skill=speaking');

  if (loading) return <SkeletonPractice />;

  if (error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Button variant="outline" onClick={() => router.push('/practice?skill=speaking')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-200/20 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-amber-200/15 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-rose-200/10 blur-3xl" />
      </div>

      <SpeakingPracticeHeader
        title={testDetail.title}
        currentPart={currentPart}
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        onExit={handleExit}
      />

      <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30">
        {/* Left sidebar */}
        <div className="w-[22%] min-w-[200px] overflow-y-auto p-3">
          <SpeakingTopicSidebar
            questions={questions}
            currentIndex={currentQuestionIndex}
            completedIds={completedIds}
            onSelect={(idx) => {
              setCurrentQuestionIndex(idx);
              setShowSample(false);
            }}
          />
        </div>

        {/* Center */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-0">
          {currentQuestion && (
            <>
              <SpeakingQuestionCenter
                question={currentQuestion}
                showSample={showSample}
                onToggleSample={() => setShowSample((v) => !v)}
                onPrev={() => {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                  setShowSample(false);
                }}
                onNext={() => {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setShowSample(false);
                }}
                canPrev={currentQuestionIndex > 0}
                canNext={currentQuestionIndex < questions.length - 1}
              />

              <SpeakingRecorder
                key={`${taskId}-recorder`}
                taskId={taskId}
                maxDuration={180}
                existingBlob={lastRecordedBlob}
                onRecordingComplete={handleRecordingComplete}
              />

              <SpeakingFeedbackPanel
                feedback={questionRecording?.feedback ?? currentRecording?.feedback ?? null}
                isScoring={isScoring}
                scoringError={scoringError}
              />
            </>
          )}

          {allRecorded && (
            <div className="mt-6 space-y-3">
              <p className="text-center text-sm text-muted-foreground font-medium">
                Đã ghi âm {Object.keys(recordedBlobs).length}/{questions.length} câu
              </p>
              <button
                onClick={handleSubmitForScoring}
                disabled={isScoring}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-300/30 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-300/40 border border-blue-400/20 disabled:opacity-50"
              >
                🤖 Nộp bài
              </button>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-[20%] min-w-[180px] overflow-y-auto p-3">
          <SpeakingNotesPanel notes={notes} onNotesChange={setNotes} />
        </div>
      </div>

      <ConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        title="Thoát bài tập?"
        description="Tiến độ ghi âm của bạn sẽ không được lưu. Bạn có chắc chắn muốn thoát?"
        confirmText="Thoát"
        cancelText="Tiếp tục"
        variant="destructive"
        onConfirm={handleConfirmExit}
      />
    </div>
  );
}
