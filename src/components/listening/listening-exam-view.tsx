'use client';

import { useState, useMemo } from 'react';
import { ListeningExamHeader } from '@/components/listening/listening-exam-header';
import { ListeningPartInfo } from '@/components/listening/listening-part-info';
import { ListeningExamQuestionNav } from '@/components/listening/listening-exam-question-nav';
import { ListeningQuestionMcq } from '@/components/listening/listening-question-mcq';
import { ListeningGapFilling } from '@/components/listening/listening-gap-filling';
import { ListeningMatchingInformation } from '@/components/listening/listening-matching-information';
import { ListeningMatchingFeature } from '@/components/listening/listening-matching-feature';
import { ListeningAudioPlayer } from '@/components/listening/listening-audio-player';
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
  submitted: boolean;
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
  submitted,
  isPlaying,
  elapsedTime,
}: Props) {
  const [activeStimulusIdx, setActiveStimulusIdx] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);

  const currentStimulus = stimuli[activeStimulusIdx];

  // Flatten all questions for navigation
  const allQuestionIds = useMemo(
    () => stimuli.flatMap((s) => s.questionGroups.flatMap((g) => g.questions.map((q) => q.id))),
    [stimuli]
  );
  const currentQuestionId = activeQuestionId ?? allQuestionIds[0] ?? null;
  const currentQuestionIndex = allQuestionIds.indexOf(currentQuestionId ?? -1);

  // Calculate total questions for current stimulus
  const totalQuestions = useMemo(() => {
    if (!currentStimulus) return 0;
    return currentStimulus.questionGroups.reduce((sum, g) => sum + g.questions.length, 0);
  }, [currentStimulus]);

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

  // Prev/Next move by question across all stimuli
  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      moveToQuestion(allQuestionIds[currentQuestionIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < allQuestionIds.length - 1) {
      moveToQuestion(allQuestionIds[currentQuestionIndex + 1]);
    }
  };

  const canGoPrev = currentQuestionIndex > 0;
  const canGoNext = currentQuestionIndex < allQuestionIds.length - 1;

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

  // Render question group
  const renderQuestionGroup = (group: QuestionGroupDetail) => {
    const type = group.questionTypeCode as QuestionTypeCode;

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
          questionPositionById={group.questions.reduce((acc, q) => {
            acc[q.id] = q.position;
            return acc;
          }, {} as Record<number, number>)}
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
          examMode
          questionPositionById={group.questions.reduce((acc, q) => {
            acc[q.id] = q.position;
            return acc;
          }, {} as Record<number, number>)}
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
          examMode
          questionPositionById={group.questions.reduce((acc, q) => {
            acc[q.id] = q.position;
            return acc;
          }, {} as Record<number, number>)}
        />
      );
    }

    return (
      <div key={group.id} className="space-y-4">
        {group.questions.map((question) => (
          <ListeningQuestionMcq
            key={question.id}
            questionId={question.id}
            position={question.position}
            content={question.content}
            options={question.options}
            selectedId={answers[question.id]}
            submitted={submitted}
            explanation={question.explanation}
            onAnswer={onAnswer}
            examMode
          />
        ))}
      </div>
    );
  };

  if (stimuli.length === 0) {
    return <div className="p-8 text-center text-gray-500">No questions available</div>;
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-white">
      {/* Header */}
      <ListeningExamHeader isPlaying={isPlaying} elapsedTime={elapsedTime} />

      {/* Audio player (hidden but functional) */}
      {currentStimulus?.mediaUrl && <ListeningAudioPlayer audioUrl={currentStimulus.mediaUrl} />}

      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Part info - scrolls with content */}
          <ListeningPartInfo
            section={currentStimulus.section ?? activeStimulusIdx + 1}
            questionRange={`1-${totalQuestions}`}
            instruction={currentStimulus.questionGroups[0]?.instruction}
          />

          {/* Render all question groups from all stimuli */}
          {stimuli.map((stimulus, sIdx) => (
            <div key={stimulus.id} className="space-y-4">
              {stimulus.questionGroups.map((group) => (
                <div key={group.id}>
                  {/* Group header */}
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      Questions {group.questions[0]?.position}-{group.questions[group.questions.length - 1]?.position}
                    </h3>
                    {!GAP_TYPES.includes(group.questionTypeCode as QuestionTypeCode) && group.instruction && (
                      <p className="text-sm text-gray-600 mt-1">{group.instruction}</p>
                    )}
                  </div>

                  {/* Questions */}
                  {renderQuestionGroup(group)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      {allQuestionIds.length > 0 && (
        <ListeningExamQuestionNav
          stimuli={stimuli}
          questionGroups={currentStimulus?.questionGroups ?? []}
          answeredQuestions={answeredQuestionIds}
          submitted={submitted}
          onPrev={handlePrev}
          onNext={handleNext}
          onSubmit={onSubmit}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          partLabel={`Part ${currentStimulus?.section ?? activeStimulusIdx + 1}`}
          activeQuestionId={currentQuestionId}
          activePartIndex={activeStimulusIdx}
          onNavigate={setActiveQuestionId}
          onPartChange={setActiveStimulusIdx}
        />
      )}
    </div>
  );
}
