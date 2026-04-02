'use client';

import { useState, useMemo } from 'react';
import { Volume2, Wifi, Bell, Menu, Clock } from 'lucide-react';
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
function ReadingPartInfo({ section, questionCount }: { section: number; questionCount: number }) {
  return (
    <div className="shrink-0 border-b border-gray-200 bg-[#f1f2ea] px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="rounded bg-[#f3f4f6] px-2 py-1 text-xs font-semibold text-gray-900">
          Part {section}
        </div>
        <p className="text-sm text-gray-900">
          Read the text and answer questions 1-{questionCount}.
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
  submitted,
  elapsedTime,
}: Props) {
  const [activeStimulusIdx, setActiveStimulusIdx] = useState(0);
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);

  const currentStimulus = stimuli[activeStimulusIdx];
  const currentGroup = currentStimulus?.questionGroups[activeGroupIdx];

  // Calculate total questions for current stimulus
  const totalQuestions = useMemo(() => {
    if (!currentStimulus) return 0;
    return currentStimulus.questionGroups.reduce((sum, g) => sum + g.questions.length, 0);
  }, [currentStimulus]);

  // Get answered count
  const answeredCount = useMemo(() => {
    let count = 0;
    currentStimulus?.questionGroups.forEach((g) => {
      g.questions.forEach((q) => {
        if (answers[q.id] != null && answers[q.id] !== 0) count++;
        if ((textAnswers[q.id] ?? '').trim() !== '') count++;
      });
    });
    return count;
  }, [currentStimulus, answers, textAnswers]);

  // Navigation handlers
  const handlePrev = () => {
    if (activeGroupIdx > 0) {
      setActiveGroupIdx(activeGroupIdx - 1);
    }
  };

  const handleNext = () => {
    if (currentStimulus && activeGroupIdx < currentStimulus.questionGroups.length - 1) {
      setActiveGroupIdx(activeGroupIdx + 1);
    }
  };

  const canGoPrev = activeGroupIdx > 0;
  const canGoNext = currentStimulus ? activeGroupIdx < currentStimulus.questionGroups.length - 1 : false;

  // Flatten all question IDs for nav
  const answeredQuestionIds = new Set<number>();
  currentStimulus?.questionGroups.forEach((g) => {
    g.questions.forEach((q) => {
      if (answers[q.id] != null && answers[q.id] !== 0) answeredQuestionIds.add(q.id);
      if ((textAnswers[q.id] ?? '').trim() !== '') answeredQuestionIds.add(q.id);
    });
  });

  if (!currentStimulus) {
    return <div className="p-8 text-center text-gray-500">No questions available</div>;
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#f5f6f8]">
      {/* Header */}
      <ReadingExamHeader elapsedTime={elapsedTime} />

      {/* Part info */}
      <ReadingPartInfo section={currentStimulus.section ?? activeStimulusIdx + 1} questionCount={totalQuestions} />

      {/* Main content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Passage (left side) */}
        <div className="w-[54%] border-r border-gray-300 bg-white">
          <div className="h-full overflow-y-auto px-6 py-6">
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
          <div className="h-full overflow-y-auto px-6 py-6">
            {currentGroup && (
              <ReadingExamQuestionsPanel
                stimulus={{
                  ...currentStimulus,
                  questionGroups: [currentGroup],
                }}
                submitted={submitted}
                answers={answers}
                onAnswer={onAnswer}
                textAnswers={textAnswers}
                onTextAnswer={onTextAnswer}
              />
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      {currentStimulus.questionGroups.length > 0 && (
        <ReadingExamQuestionNav
          questionGroups={currentStimulus.questionGroups}
          answeredQuestions={answeredQuestionIds}
          submitted={submitted}
          onPrev={handlePrev}
          onNext={handleNext}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          partLabel={`Part ${currentStimulus.section ?? activeStimulusIdx + 1}`}
        />
      )}
    </div>
  );
}
