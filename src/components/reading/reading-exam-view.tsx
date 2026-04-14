'use client';

import { useMemo, useState } from 'react';
import { Wifi, Bell, Menu, Clock } from 'lucide-react';
import { ReadingExamQuestionsPanel } from '@/components/reading/reading-exam-questions-panel';
import { ReadingExamQuestionNav } from '@/components/reading/reading-exam-question-nav';
import { ReadingPassage } from '@/components/reading/reading-passage';
import { ReadingPassageWithMatching } from '@/components/reading/reading-passage-with-matching';
import type { StimulusDetail } from '@/types/test.types';

interface Props {
  stimuli: StimulusDetail[];
  answers: Record<number, number>;
  textAnswers: Record<number, string>;
  onAnswer: (questionId: number, optionId: number) => void;
  onTextAnswer: (questionId: number, text: string) => void;
  onSubmit?: () => void;
  submitted: boolean;
  elapsedTime?: string;
}

/** IELTS-style header for reading exam */
function ReadingExamHeader({ 
  elapsedTime,
}: { 
  elapsedTime?: string; 
}) {
  return (
    <header className="shrink-0 flex items-center justify-between px-4 py-2 bg-white border-b border-gray-300">
      {/* Left: IELTS Logo + Timer */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[26px] font-bold tracking-tight" style={{ color: '#C8102E' }}>
            IELTS<sup className="text-[10px] font-normal">™</sup>
          </span>
        </div>
        {elapsedTime && (
          <div className="flex items-center gap-1.5 text-gray-900">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-mono font-semibold">{elapsedTime}</span>
          </div>
        )}
      </div>

      {/* Right: Icons */}
      <div className="flex items-center gap-4">
        <Wifi className="h-5 w-5 text-gray-700" />
        <Bell className="h-5 w-5 text-gray-700" />
        <Menu className="h-6 w-6 text-gray-700" />
      </div>
    </header>
  );
}

/** IELTS-style part info banner */
function ReadingPartInfo({ section, questionCount, questionStart = 1 }: { section: number; questionCount: number; questionStart?: number }) {
  return (
    <div className="shrink-0 border-b border-gray-200 bg-[#f1f2ea] px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="text-xs font-semibold text-gray-900">
          Part {section}
        </div>
        <p className="text-sm text-gray-900">
          Read the text and answer questions {questionStart}-{questionCount}.
        </p>
      </div>
    </div>
  );
}

export function ReadingExamView({
  stimuli,
  answers,
  textAnswers,
  onAnswer,
  onTextAnswer,
  onSubmit,
  submitted,
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

  if (!currentStimulus) {
    return <div className="p-8 text-center text-gray-500">No questions available</div>;
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#f5f6f8]">
      {/* Header */}
      <ReadingExamHeader elapsedTime={elapsedTime} />

      {/* Part info */}
      <ReadingPartInfo 
        section={currentStimulus.section ?? activeStimulusIdx + 1} 
        questionCount={globalQuestionRange.end}
        questionStart={globalQuestionRange.start}
      />

      {/* Main content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Passage (left side) */}
        <div className="w-[54%] border-r border-gray-300 bg-white">
          <div className="h-full overflow-y-auto reading-scrollbar px-6 py-6">
            {(() => {
              const matchingGroup = currentStimulus.questionGroups.find(
                (g) => g.questionTypeCode === 'MATCHING_HEADINGS'
              );
              return matchingGroup ? (
                <ReadingPassageWithMatching
                  content={currentStimulus.content}
                  questions={matchingGroup.questions}
                  answers={answers}
                  submitted={submitted}
                  onAnswer={onAnswer}
                  selectedPillId={null}
                  onPillAssigned={() => {}}
                  examMode
                />
              ) : (
                <ReadingPassage content={currentStimulus.content} interactive={false} examMode />
              );
            })()}
          </div>
        </div>

        {/* Questions (right side) */}
        <div className="flex-1 bg-white">
          <div className="h-full overflow-y-auto reading-scrollbar px-6 py-6">
            <ReadingExamQuestionsPanel
              stimulus={currentStimulus}
              submitted={submitted}
              answers={answers}
              onAnswer={onAnswer}
              textAnswers={textAnswers}
              onTextAnswer={onTextAnswer}
              globalQuestionOffset={globalQuestionOffset}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      {currentStimulus.questionGroups.length > 0 && (
        <ReadingExamQuestionNav
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
    </div>
  );
}
