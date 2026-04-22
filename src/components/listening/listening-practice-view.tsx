'use client';

import { useState, useMemo } from 'react';
import { ListeningExamHeader } from '@/components/listening/listening-exam-header';
import { ListeningPartInfo } from '@/components/listening/listening-part-info';
import { ListeningExamQuestionNav } from '@/components/listening/listening-exam-question-nav';
import { ListeningPracticeAudioPlayer } from '@/components/listening/listening-practice-audio-player';
import { ListeningQuestionMcq } from '@/components/listening/listening-question-mcq';
import { ListeningGapFilling } from '@/components/listening/listening-gap-filling';
import { ListeningMatchingInformation } from '@/components/listening/listening-matching-information';
import { ListeningMatchingFeature } from '@/components/listening/listening-matching-feature';
import { PracticeSubmitOverlay } from '@/components/ui/practice-submit-overlay';
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

export function ListeningPracticeView({
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

  const currentStimulus = stimuli[activeStimulusIdx];
  const currentQuestionIds = useMemo(
    () => currentStimulus?.questionGroups.flatMap((group) => group.questions.map((question) => question.id)) ?? [],
    [currentStimulus]
  );
  const currentQuestionId = activeQuestionId ?? currentQuestionIds[0] ?? null;
  const currentQuestionIndex = currentQuestionIds.indexOf(currentQuestionId ?? -1);

  // Calculate global question offset for current stimulus
  const globalQuestionOffset = useMemo(() => {
    let offset = 1;
    for (let i = 0; i < activeStimulusIdx; i++) {
      offset += stimuli[i].questionGroups.reduce((sum, g) => sum + g.questions.length, 0);
    }
    return offset;
  }, [stimuli, activeStimulusIdx]);

  // Calculate total questions for current stimulus
  const totalQuestions = useMemo(() => {
    if (!currentStimulus) return 0;
    return currentStimulus.questionGroups.reduce((sum, g) => sum + g.questions.length, 0);
  }, [currentStimulus]);

  // Calculate global question range for header
  const globalQuestionRange = useMemo(() => {
    if (!currentStimulus) return { start: 1, end: 0 };
    const end = globalQuestionOffset + totalQuestions - 1;
    return { start: globalQuestionOffset, end };
  }, [currentStimulus, globalQuestionOffset, totalQuestions]);

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
    currentStimulus?.questionGroups.forEach((group) => {
      group.questions.forEach((question) => {
        if (answers[question.id] != null && answers[question.id] !== 0) ids.add(question.id);
        if ((textAnswers[question.id] ?? '').trim() !== '') ids.add(question.id);
      });
    });
    return ids;
  }, [currentStimulus, answers, textAnswers]);

  // Render question group with global question positions
  const renderQuestionGroup = (group: QuestionGroupDetail) => {
    const type = group.questionTypeCode as QuestionTypeCode;

    // Build position map with global offsets
    const questionPositionById: Record<number, number> = {};
    let pos = globalQuestionOffset;
    for (const g of currentStimulus.questionGroups) {
      if (g.id === group.id) break;
      pos += g.questions.length;
    }
    group.questions.forEach((q, idx) => {
      questionPositionById[q.id] = pos + idx;
    });

    if (GAP_TYPES.includes(type)) {
      return (
        <ListeningGapFilling
          key={group.id}
          questions={group.questions}
          groupContent={group.groupContent}
          imageUrl={group.imageUrl}
          submitted={submitted}
          textAnswers={textAnswers}
          onTextAnswer={onTextAnswer}
          examMode={true}
          questionPositionById={questionPositionById}
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
          onAnswer={onAnswer}
          questionPositionById={questionPositionById}
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
          onAnswer={onAnswer}
          questionPositionById={questionPositionById}
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
            explanation={question.explanation}
            onAnswer={onAnswer}
          />
        ))}
      </div>
    );
  };

  if (!currentStimulus) {
    return <div className="p-8 text-center text-gray-500">No questions available</div>;
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-white">
      {/* Header */}
      <ListeningExamHeader isPlaying={isPlaying} elapsedTime={elapsedTime} />

      {/* Audio player for current part */}
      {currentStimulus.mediaUrl && <ListeningPracticeAudioPlayer audioUrl={currentStimulus.mediaUrl} />}

      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Part info */}
          <ListeningPartInfo
            section={currentStimulus.section ?? activeStimulusIdx + 1}
            questionRange={`${globalQuestionRange.start}-${globalQuestionRange.end}`}
            instruction={currentStimulus.questionGroups[0]?.instruction}
          />

          {/* Render question groups for current stimulus only */}
          {currentStimulus.questionGroups.map((group) => {
            // Calculate the offset for this specific group
            let groupOffset = globalQuestionOffset;
            for (const prevGroup of currentStimulus.questionGroups) {
              if (prevGroup.id === group.id) break;
              groupOffset += prevGroup.questions.length;
            }
            const groupGlobalEnd = groupOffset + group.questions.length - 1;

            return (
              <div key={group.id}>
                {/* Group header with global question numbers */}
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    Questions {groupOffset}-{groupGlobalEnd}
                  </h3>
                  {!GAP_TYPES.includes(group.questionTypeCode as QuestionTypeCode) && group.instruction && (
                    <p className="text-sm text-gray-600 mt-1">{group.instruction}</p>
                  )}
                </div>

                {/* Questions */}
                {renderQuestionGroup(group)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation with part switching */}
      {currentStimulus.questionGroups.length > 0 && (
        <ListeningExamQuestionNav
          stimuli={stimuli}
          questionGroups={currentStimulus.questionGroups}
          answeredQuestions={answeredQuestionIds}
          submitted={submitted}
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

      {/* Submission Animation */}
      <PracticeSubmitOverlay isSubmitting={isSubmitting} submitted={submitted} />
    </div>
  );
}
