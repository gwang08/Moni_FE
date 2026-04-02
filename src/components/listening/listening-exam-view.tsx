'use client';

import { useState, useMemo, useEffect } from 'react';
import { ListeningExamHeader } from '@/components/listening/listening-exam-header';
import { ListeningPartInfo } from '@/components/listening/listening-part-info';
import { ListeningExamQuestionNav } from '@/components/listening/listening-exam-question-nav';
import { ListeningQuestionMcq } from '@/components/listening/listening-question-mcq';
import { ListeningGapFilling } from '@/components/listening/listening-gap-filling';
import { ListeningAudioPlayer } from '@/components/listening/listening-audio-player';
import type { StimulusDetail, QuestionGroupDetail } from '@/types/test.types';
import type { QuestionTypeCode } from '@/types/admin.types';

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

const GAP_TYPES: QuestionTypeCode[] = ['GAP_FILLING', 'DIAGRAM_LABEL'];

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentStimulus = stimuli[activeStimulusIdx];

  // Flatten all questions for navigation
  const allQuestions = useMemo(() => {
    const questions: { questionId: number; groupIndex: number; questionIndex: number; type: QuestionTypeCode }[] = [];
    stimuli.forEach((stimulus, sIdx) => {
      stimulus.questionGroups.forEach((group, gIdx) => {
        group.questions.forEach((q, qIdx) => {
          questions.push({
            questionId: q.id,
            groupIndex: gIdx,
            questionIndex: qIdx,
            type: group.questionTypeCode as QuestionTypeCode,
          });
        });
      });
    });
    return questions;
  }, [stimuli]);

  const currentQuestion = allQuestions[currentQuestionIndex];
  const currentGroup = currentStimulus?.questionGroups[currentQuestion?.groupIndex ?? 0];

  // Calculate question range for part info
  const questionRange = useMemo(() => {
    if (!currentStimulus) return '1-0';
    const totalQuestions = currentStimulus.questionGroups.reduce(
      (sum, g) => sum + g.questions.length,
      0
    );
    const startQuestion = allQuestions
      .filter((q) => stimuli.findIndex((s) => s.id === currentStimulus.id) === activeStimulusIdx)
      .reduce((min, q) => Math.min(min, allQuestions.indexOf(q)), allQuestions.length);
    const endQuestion = startQuestion + totalQuestions - 1;
    return `${startQuestion + 1}-${endQuestion + 1}`;
  }, [currentStimulus, allQuestions, stimuli, activeStimulusIdx]);

  // Get instruction from first group
  const instruction = currentGroup?.instruction;

  // Handle navigation
  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleNavigate = (questionId: number) => {
    const index = allQuestions.findIndex((q) => q.questionId === questionId);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
    }
  };

  // Scroll to current question when index changes
  useEffect(() => {
    if (currentQuestion) {
      const el = document.getElementById(`question-${currentQuestion.questionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentQuestionIndex, currentQuestion?.questionId]);

  const answeredQuestions = useMemo(() => {
    const s = new Set<number>();
    for (const [k, v] of Object.entries(answers)) {
      if (v !== 0) s.add(Number(k));
    }
    for (const [k, v] of Object.entries(textAnswers)) {
      if ((v ?? '').trim() !== '') s.add(Number(k));
    }
    return s;
  }, [answers, textAnswers]);

  if (!currentStimulus || !currentGroup) {
    return <div className="p-8 text-center text-gray-500">No questions available</div>;
  }

  // Render current question based on type
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const question = currentGroup.questions[currentQuestion.questionIndex];
    const type = currentGroup.questionTypeCode as QuestionTypeCode;

    if (GAP_TYPES.includes(type)) {
      // For gap filling, render all questions in the group
      return (
        <ListeningGapFilling
          questions={currentGroup.questions}
          groupContent={currentGroup.groupContent}
          imageUrl={currentGroup.imageUrl}
          submitted={submitted}
          textAnswers={textAnswers}
          onTextAnswer={onTextAnswer}
          examMode
        />
      );
    }

    // For MCQ and other types, render single question
    return (
      <ListeningQuestionMcq
        questionId={question.id}
        position={currentQuestionIndex + 1}
        content={question.content}
        options={question.options}
        selectedId={answers[question.id]}
        submitted={submitted}
        explanation={question.explanation}
        onAnswer={onAnswer}
        examMode
      />
    );
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-white">
      {/* Header */}
      <ListeningExamHeader isPlaying={isPlaying} elapsedTime={elapsedTime} />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Part info */}
          <ListeningPartInfo
            section={currentStimulus.section ?? activeStimulusIdx + 1}
            questionRange={questionRange}
            instruction={instruction}
          />

          {/* Questions header */}
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Questions {questionRange}
            </h2>
            {currentGroup && !GAP_TYPES.includes(currentGroup.questionTypeCode as QuestionTypeCode) && (
              <p className="text-sm text-gray-600">{instruction}</p>
            )}
          </div>

          {/* Question content */}
          {renderQuestion()}
        </div>
      </div>

      {/* Audio player (hidden but functional) */}
      {currentStimulus.mediaUrl && <ListeningAudioPlayer audioUrl={currentStimulus.mediaUrl} />}

      {/* Navigation */}
      <ListeningExamQuestionNav
        totalQuestions={allQuestions.length}
        answeredQuestions={answeredQuestions}
        questionIds={allQuestions.map((q) => q.questionId)}
        currentQuestionIndex={currentQuestionIndex}
        submitted={submitted}
        onNavigate={handleNavigate}
        onPrev={handlePrev}
        onNext={onSubmit ? undefined : handleNext}
        onSubmit={currentQuestionIndex === allQuestions.length - 1 ? onSubmit : undefined}
        canGoPrev={currentQuestionIndex > 0}
        canGoNext={currentQuestionIndex < allQuestions.length - 1}
      />
    </div>
  );
}
