'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SpeakingPracticeHeader } from '@/components/speaking/speaking-practice-header';
import { SpeakingTopicSidebar } from '@/components/speaking/speaking-topic-sidebar';
import { SpeakingQuestionCenter } from '@/components/speaking/speaking-question-center';
import { SpeakingRecorder } from '@/components/speaking/speaking-recorder';
import { SpeakingFeedbackPanel } from '@/components/speaking/speaking-feedback-panel';
import { SpeakingNotesPanel } from '@/components/speaking/speaking-notes-panel';
import { useTestDetail } from '@/hooks/use-test-detail';
import { useSpeakingStore } from '@/store/speaking-store';

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

  const [showSample, setShowSample] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [lastRecordedBlob, setLastRecordedBlob] = useState<Blob | null>(null);

  // Reset store on mount
  useEffect(() => {
    reset();
  }, [reset]);

  // Derive questions from test data
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
    // Fallback: use stimulus content as single question
    return [{
      id: 0,
      content: testDetail.stimuli[0]?.content || testDetail.description || FALLBACK_CONTENT,
      position: 1,
      sampleAnswer: undefined,
    }];
  }, [testDetail]);

  const currentPart = testDetail?.section ?? 1;
  const currentQuestion = questions[currentQuestionIndex];

  // Track which question IDs have recordings
  const completedIds = useMemo(() => {
    const ids = new Set<number>();
    recordings.forEach((r) => {
      const qId = parseInt(r.taskId.replace(`${id}-q`, ''), 10);
      if (!isNaN(qId)) ids.add(qId);
    });
    return ids;
  }, [recordings, id]);

  const taskId = currentQuestion ? `${id}-q${currentQuestion.id}` : id;

  // Current question recording feedback
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
  };

  const handleExit = () => setShowExitDialog(true);
  const handleConfirmExit = () => router.push('/practice');

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
        <Button variant="outline" onClick={() => router.push('/practice')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <SpeakingPracticeHeader
        title={testDetail.title}
        currentPart={currentPart}
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        onExit={handleExit}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: question list */}
        <div className="w-1/5 overflow-y-auto border-r p-3 bg-gray-50">
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

        {/* Center: question + recorder + feedback */}
        <div className="w-3/5 overflow-y-auto p-6 space-y-0">
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

              {/* Submit for scoring button */}
              {lastRecordedBlob && !isScoring && !scoringError && !questionRecording?.feedback && (
                <div className="mt-4">
                  <Button
                    onClick={handleSubmitForScoring}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Nhận đánh giá
                  </Button>
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

        {/* Right: notes */}
        <div className="w-1/5 overflow-y-auto border-l p-3 bg-gray-50">
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
