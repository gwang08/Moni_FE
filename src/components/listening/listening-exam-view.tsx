'use client';

import { useState, useMemo, useCallback } from 'react';
import { ListeningExamHeader } from '@/components/listening/listening-exam-header';
import { ListeningPartInfo } from '@/components/listening/listening-part-info';
import { ListeningExamQuestionNav } from '@/components/listening/listening-exam-question-nav';
import { ListeningQuestionMcq } from '@/components/listening/listening-question-mcq';
import { ListeningGapFilling } from '@/components/listening/listening-gap-filling';
import { ListeningMatchingInformation } from '@/components/listening/listening-matching-information';
import { ListeningMatchingFeature } from '@/components/listening/listening-matching-feature';
import { ListeningAudioPlayer } from '@/components/listening/listening-audio-player';
import { useListeningStore } from '@/store/listening-store';
import type { StimulusDetail, QuestionGroupDetail } from '@/types/test.types';
import type { QuestionTypeCode } from '@/types/admin.types';

const GAP_TYPES: QuestionTypeCode[] = ['GAP_FILLING', 'DIAGRAM_LABEL'];
const MATCHING_INFORMATION = 'MATCHING_INFORMATION';
const MATCHING_FEATURE = 'MATCHING_FEATURE';

interface Props {
  stimuli: StimulusDetail[];
  answers: Record<number, number>;
  textAnswers: Record<number, string>;
  onAnswer: (questionId: number, optionId: number) => void;
  onTextAnswer: (questionId: number, text: string) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitted: boolean;
  readOnly?: boolean;
  isPlaying: boolean;
  elapsedTime?: string;
}

export function ListeningExamView({
  stimuli,
  answers,
  textAnswers,
  onAnswer,
  onTextAnswer,
  onSubmit,
  isSubmitting = false,
  submitted,
  readOnly = false,
  isPlaying,
  elapsedTime,
}: Props) {
  const [activeStimulusIdx, setActiveStimulusIdx] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const { seekTo } = useListeningStore();

  const onLocateEvidence = useCallback((text: string, offset?: number, startOffset?: number, endOffset?: number, startTime?: number) => {
    if (startTime !== undefined && startTime !== -1) {
      seekTo?.(startTime);
    }
  }, [seekTo]);

  const currentStimulus = stimuli[activeStimulusIdx];
  const isDisabled = submitted || readOnly || isSubmitting;

  // Flatten all questions for navigation
  const allQuestionIds = useMemo(
    () => stimuli.flatMap((s) => s.questionGroups.flatMap((g) => g.questions.map((q) => q.id))),
    [stimuli]
  );
  const currentQuestionIds = useMemo(
    () => currentStimulus?.questionGroups.flatMap((group) => group.questions.map((question) => question.id)) ?? [],
    [currentStimulus]
  );
  const currentQuestionId = activeQuestionId ?? currentQuestionIds[0] ?? null;
  const currentQuestionIndex = currentQuestionIds.indexOf(currentQuestionId ?? -1);

  // Build global question position map - maps question ID to its global position (1-based)
  const globalQuestionPositionById = useMemo(() => {
    const map: Record<number, number> = {};
    allQuestionIds.forEach((qId, idx) => {
      map[qId] = idx + 1;
    });
    return map;
  }, [allQuestionIds]);

  const scrollToQuestion = (questionId: number) => {
    const el = document.getElementById(`question-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const moveToQuestion = (questionId: number) => {
    setActiveQuestionId(questionId);
    scrollToQuestion(questionId);
  };

  // Prev/Next move by question within the current stimulus, then across stimuli at boundaries.
  const handlePrev = () => {
    if (!currentQuestionIds.length) return;
    const currentIndex = currentQuestionIds.indexOf(currentQuestionId ?? currentQuestionIds[0]);

    if (currentIndex > 0) {
      moveToQuestion(currentQuestionIds[currentIndex - 1]);
      return;
    }

    if (activeStimulusIdx > 0) {
      const nextIdx = activeStimulusIdx - 1;
      const nextQuestionId = stimuli[nextIdx]?.questionGroups.flatMap((group) => group.questions.map((question) => question.id))[0] ?? null;
      setActiveStimulusIdx(nextIdx);
      setActiveQuestionId(nextQuestionId);
      if (nextQuestionId != null) {
        window.requestAnimationFrame(() => scrollToQuestion(nextQuestionId));
      }
    }
  };

  const handleNext = () => {
    if (!currentQuestionIds.length) return;
    const currentIndex = currentQuestionIds.indexOf(currentQuestionId ?? currentQuestionIds[0]);

    if (currentIndex >= 0 && currentIndex < currentQuestionIds.length - 1) {
      moveToQuestion(currentQuestionIds[currentIndex + 1]);
      return;
    }

    if (activeStimulusIdx < stimuli.length - 1) {
      const nextIdx = activeStimulusIdx + 1;
      const nextQuestionId = stimuli[nextIdx]?.questionGroups.flatMap((group) => group.questions.map((question) => question.id))[0] ?? null;
      setActiveStimulusIdx(nextIdx);
      setActiveQuestionId(nextQuestionId);
      if (nextQuestionId != null) {
        window.requestAnimationFrame(() => scrollToQuestion(nextQuestionId));
      }
    }
  };

  const canGoPrev = currentQuestionIndex > 0 || activeStimulusIdx > 0;
  const canGoNext = currentQuestionIndex >= 0
    ? currentQuestionIndex < currentQuestionIds.length - 1 || activeStimulusIdx < stimuli.length - 1
    : activeStimulusIdx < stimuli.length - 1;

  const answeredQuestionIds = useMemo(() => {
    const ids = new Set<number>();
    stimuli.forEach((stimulus) => {
      stimulus.questionGroups.forEach((group) => {
        group.questions.forEach((question) => {
          if (answers[question.id] != null && answers[question.id] !== 0) ids.add(question.id);
          if ((textAnswers[question.id] ?? '').trim() !== '') ids.add(question.id);
        });
      });
    });
    return ids;
  }, [stimuli, answers, textAnswers]);

  // Render question group with global question positions
  const renderQuestionGroup = (group: QuestionGroupDetail) => {
    const type = group.questionTypeCode as QuestionTypeCode;

    // Use the global position map directly
    const questionPositionById = globalQuestionPositionById;

    if (GAP_TYPES.includes(type)) {
      return (
        <ListeningGapFilling
          key={group.id}
          questions={group.questions}
          groupContent={group.groupContent}
          imageUrl={group.imageUrl}
          submitted={submitted}
          readOnly={isDisabled}
          textAnswers={textAnswers}
          onTextAnswer={onTextAnswer}
          examMode={true}
          questionPositionById={questionPositionById}
          onLocateEvidence={onLocateEvidence}
        />
      );
    }

    if (type === MATCHING_INFORMATION) {
      return (
        <ListeningMatchingInformation
          key={group.id}
          questions={group.questions}
          answers={answers}
          submitted={submitted}
          readOnly={isDisabled}
          onAnswer={onAnswer}
          examMode
          questionPositionById={questionPositionById}
          onLocateEvidence={onLocateEvidence}
        />
      );
    }

    if (type === MATCHING_FEATURE) {
      return (
        <ListeningMatchingFeature
          key={group.id}
          questions={group.questions}
          answers={answers}
          submitted={submitted}
          readOnly={isDisabled}
          onAnswer={onAnswer}
          examMode
          questionPositionById={questionPositionById}
          onLocateEvidence={onLocateEvidence}
        />
      );
    }

    return (
      <div key={group.id} className="space-y-4">
        {group.questions.map((question) => (
          <ListeningQuestionMcq
            key={question.id}
            questionId={question.id}
            position={questionPositionById[question.id]}
            content={question.content}
            options={question.options}
            selectedId={answers[question.id]}
            submitted={submitted}
            readOnly={isDisabled}
            explanation={question.explanation}
            onAnswer={onAnswer}
            onLocateEvidence={onLocateEvidence}
            examMode
          />
        ))}
      </div>
    );
  };

  if (!currentStimulus) {
    return <div className="p-8 text-center text-gray-500">No questions available</div>;
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#f5f6f8] relative">
      <style jsx global>{`
        .reading-scrollbar {
          scrollbar-width: auto;
          scrollbar-color: #888 #f1f1f1;
        }

        .reading-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .reading-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 0;
        }

        .reading-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 0;
          border: 0;
        }

        .reading-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #666;
        }

        .reading-scrollbar::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }

        .reading-scrollbar::-webkit-scrollbar-corner {
          background: #f1f1f1;
        }
      `}</style>

      {/* ===== Loading Overlay ===== */}
      {(isSubmitting || (readOnly && !submitted)) && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-4 scale-in-95 animate-in zoom-in-95 duration-300">
            <div className="h-12 w-12 rounded-full border-4 border-gray-100 border-t-blue-600 animate-spin" />
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-lg">Đang nộp bài...</h3>
              <p className="text-sm text-gray-500 mt-1">Hệ thống đang lưu kết quả của bạn</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <ListeningExamHeader isPlaying={isPlaying} elapsedTime={elapsedTime} onFinish={onSubmit} />

      {/* Audio player (hidden but functional) - use first stimulus audio */}
      {stimuli[0]?.mediaUrl && <ListeningAudioPlayer audioUrl={stimuli[0].mediaUrl} />}

      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto reading-scrollbar">
        <div className="px-10 py-8">
          <div className="space-y-8">
            {/* Render current stimulus only */}
            <div key={currentStimulus.id} className="space-y-4">
              {currentStimulus.questionGroups.map((group) => {
                // Get global question range for this group
                const firstQId = group.questions[0]?.id;
                const lastQId = group.questions[group.questions.length - 1]?.id;
                const groupStart = firstQId ? globalQuestionPositionById[firstQId] : 1;
                const groupEnd = lastQId ? globalQuestionPositionById[lastQId] : group.questions.length;

                return (
                  <div key={group.id}>
                    {/* Group header with global question numbers */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Questions {groupStart}-{groupEnd}
                      </h3>
                      {!GAP_TYPES.includes(group.questionTypeCode as QuestionTypeCode) && group.instruction && (
                        <p className="text-[15px] text-gray-600 mt-1 italic">{group.instruction}</p>
                      )}
                    </div>

                    {/* Questions */}
                    {renderQuestionGroup(group)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation with part switching */}
      {currentStimulus.questionGroups.length > 0 && (
        <ListeningExamQuestionNav
          stimuli={stimuli}
          questionGroups={currentStimulus.questionGroups}
          answeredQuestions={answeredQuestionIds}
          submitted={submitted || readOnly || isSubmitting}
          onPrev={handlePrev}
          onNext={handleNext}
          onSubmit={onSubmit}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          partLabel={`Part ${currentStimulus.section ?? activeStimulusIdx + 1}`}
          activeQuestionId={currentQuestionId}
          activePartIndex={activeStimulusIdx}
          onNavigate={setActiveQuestionId}
          onPartChange={setActiveStimulusIdx}
        />
      )}
    </div>
  );
}
