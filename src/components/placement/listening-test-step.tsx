'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ListeningAudioPlayer } from '@/components/listening/listening-audio-player';
import { ReadingQuestionsPanel } from '@/components/reading/reading-questions-panel';
import type { TestDetailResponse } from '@/types/test.types';

interface Props {
  testDetail: TestDetailResponse;
  answers: Record<number, number>;
  textAnswers: Record<number, string>;
  onAnswer: (questionId: number, optionId: number) => void;
  onTextAnswer: (questionId: number, text: string) => void;
  onComplete: () => void;
}

export function ListeningTestStep({ testDetail, answers, textAnswers, onAnswer, onTextAnswer, onComplete }: Props) {
  const [activeStimulusIdx, setActiveStimulusIdx] = useState(0);
  const stimuli = testDetail.stimuli;
  const currentStimulus = stimuli[activeStimulusIdx];

  if (!currentStimulus) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Không có nội dung bài nghe</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-bold text-gray-900">Kiểm tra trình độ - Listening</h1>
          <p className="text-xs text-gray-500">{testDetail.title}</p>
        </div>
        <div className="flex items-center gap-3">
          {stimuli.length > 1 && (
            <div className="flex items-center gap-1">
              {stimuli.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStimulusIdx(i)}
                  className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                    i === activeStimulusIdx
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Section {i + 1}
                </button>
              ))}
            </div>
          )}
          <Button onClick={onComplete} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">
            Hoàn thành Listening
          </Button>
        </div>
      </div>

      {/* Scrollable questions */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ReadingQuestionsPanel
            stimulus={currentStimulus}
            submitted={false}
            answers={answers}
            onAnswer={onAnswer}
            textAnswers={textAnswers}
            onTextAnswer={onTextAnswer}
          />
        </div>
      </div>

      {/* Audio player pinned at bottom */}
      {currentStimulus.mediaUrl && (
        <ListeningAudioPlayer audioUrl={currentStimulus.mediaUrl} />
      )}
    </div>
  );
}
