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
  const [lastRecordedBlob, setLastRecordedBlob] = useState<Blob | null>(null);
  const [hasMarkedCompleted, setHasMarkedCompleted] = useState(false);

  useEffect(() => {
    reset();
  }, [reset]);

  const questions = useMemo(() => {
    if (!testDetail) return [];
    const qs = testDetail.stimuli[0]?.questionGroups?.[0]?.questions ?? [];
    if (qs.length > 0) {
      return qs.map((q) => ({
        id: q.id,
        content: q.content || FALLBACK_CONTENT,
        position: q.position,
        sampleAnswer: q.explanation?.text,
      }));
    }
    return [{
      id: 0,
      content: testDetail.stimuli[0]?.content || testDetail.description || FALLBACK_CONTENT,
      position: 1,
      sampleAnswer: undefined,
    }];
  }, [testDetail]);

  const currentPart = testDetail?.section ?? 1;
  const currentQuestion = questions[currentQuestionIndex];

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

  const handleRecordingComplete = (blob: Blob) => {
    setLastRecordedBlob(blob);
  };

  const handleSubmitForScoring = async () => {
    if (!lastRecordedBlob || !currentQuestion) return;
    const mimeType = lastRecordedBlob.type || 'audio/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([lastRecordedBlob], `recording.${ext}`, { type: mimeType });
    await submitForScoring(file, currentQuestion.content);
    // Mark as completed on first scoring submission
    if (!hasMarkedCompleted) {
      markCompleted(id);
      setHasMarkedCompleted(true);
      const stimulus = testDetail?.stimuli[0];
      if (stimulus) {
        try {
          await submitAttempt({
            testId: Number(id),
            stimulusId: stimulus.id,
            elapsedSeconds: 0,
            answers: [{ questionId: currentQuestion.id, answerText: currentQuestion.content }],
          });
        } catch { /* ignore */ }
      }
    }
  };

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
              setLastRecordedBlob(null);
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
                  setLastRecordedBlob(null);
                }}
                onNext={() => {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setShowSample(false);
                  setLastRecordedBlob(null);
                }}
                canPrev={currentQuestionIndex > 0}
                canNext={currentQuestionIndex < questions.length - 1}
              />

              <SpeakingRecorder
                key={`${taskId}-recorder`}
                taskId={taskId}
                maxDuration={180}
                onRecordingComplete={handleRecordingComplete}
              />

              {lastRecordedBlob && !isScoring && !scoringError && !questionRecording?.feedback && (
                <div className="mt-4">
                  <button
                    onClick={handleSubmitForScoring}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-300/30 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-orange-300/40 border border-orange-300/20"
                  >
                    Nhận đánh giá
                  </button>
                </div>
              )}

              <SpeakingFeedbackPanel
                feedback={questionRecording?.feedback ?? currentRecording?.feedback ?? null}
                isScoring={isScoring}
                scoringError={scoringError}
              />
            </>
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
