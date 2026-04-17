'use client';

import Image from 'next/image';
import { Wifi, Bell, Menu, Clock } from 'lucide-react';
import { WritingEditor } from './writing-editor';
import { WritingPromptPanel } from './writing-prompt-panel';
import { WritingToolbarPanel } from './writing-toolbar-panel';
import { WritingPracticeFooter } from './writing-practice-footer';
import type { WritingTaskType } from '@/types/writing.types';

interface WritingPracticeViewProps {
  title: string;
  prompt: string;
  chartImageUrl?: string;
  taskType: WritingTaskType;
  content: string;
  wordCount: number;
  sampleAnswer?: string;
  showSample: boolean;
  onToggleSample: () => void;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitted: boolean;
  elapsedTime: string;
  onExit: () => void;
  // Navigation props
  totalTasks?: number;
  activeTaskIndex?: number;
  onTaskChange?: (index: number) => void;
  taskTypes?: WritingTaskType[];
}

const MIN_WORDS: Record<number, number> = {
  1: 150,
  2: 250,
};

function WritingPracticeHeader({
  title,
  taskType,
  elapsedTime,
  onExit,
}: {
  title: string;
  taskType: number;
  elapsedTime: string;
  onExit: () => void;
}) {
  return (
    <header className="shrink-0 flex items-center justify-between px-4 py-2 bg-white border-b border-gray-300">
      {/* Left: IELTS Logo + Timer */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
          >
            <span className="text-[#e31837] text-xl font-black tracking-tight select-none" style={{ fontFamily: 'Arial Black, sans-serif' }}>
              IELTS<span className="text-[8px] align-super ml-0.5 font-normal text-gray-500">™</span>
            </span>
          </button>
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

function WritingPartInfo({ taskType, wordCount }: { taskType: number; wordCount: number }) {
  const minWords = MIN_WORDS[taskType] ?? 150;
  const hasMetMin = wordCount >= minWords;

  return (
    <div className="shrink-0 border-b border-gray-200 bg-[#f1f2ea] px-4 py-2">
      <div className="flex items-center gap-3">
        <div className={`text-xs font-semibold ${hasMetMin ? 'text-emerald-600' : 'text-gray-900'}`}>
          Part {taskType}
        </div>
        <p className="text-sm text-gray-900">
          {taskType === 1
            ? `You should spend about 20 minutes on this task. Write at least ${minWords} words.`
            : `You should spend about 40 minutes on this task. Write at least ${minWords} words.`}
        </p>
      </div>
    </div>
  );
}

export function WritingPracticeView({
  title,
  prompt,
  chartImageUrl,
  taskType,
  content,
  wordCount,
  sampleAnswer,
  showSample,
  onToggleSample,
  onContentChange,
  onSubmit,
  isSubmitting,
  submitted,
  elapsedTime,
  onExit,
  totalTasks = 1,
  activeTaskIndex = 0,
  onTaskChange,
  taskTypes = [2],
}: WritingPracticeViewProps) {
  const minWords = MIN_WORDS[taskType] ?? 150;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#f5f6f8]">
      {/* Header */}
      <WritingPracticeHeader
        title={title}
        taskType={taskType}
        elapsedTime={elapsedTime}
        onExit={onExit}
      />

      {/* Part info */}
      <WritingPartInfo taskType={taskType} wordCount={wordCount} />

      {/* Main content - 3 column layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left: Prompt panel */}
        <div className="w-[28%] overflow-y-auto p-4">
          <WritingPromptPanel
            prompt={prompt}
            chartImageUrl={chartImageUrl}
            taskType={taskType}
          />
        </div>

        {/* Center: Editor */}
        <div className="flex-1 overflow-y-auto">
          <WritingEditor
            taskType={taskType}
            sampleAnswer={sampleAnswer}
            showSample={showSample}
            onToggleSample={onToggleSample}
            readOnly={submitted}
          />
        </div>

        {/* Right: Toolbar panel */}
        <div className="w-[24%] overflow-y-auto p-4">
          <WritingToolbarPanel wordCount={wordCount} taskType={taskType} />
        </div>
      </div>

      {/* Footer navigation */}
      <WritingPracticeFooter
        taskType={taskType}
        wordCount={wordCount}
        minWords={minWords}
        isSubmitting={isSubmitting}
        submitted={submitted}
        onSubmit={onSubmit}
        totalTasks={totalTasks}
        activeTaskIndex={activeTaskIndex}
        onTaskChange={onTaskChange}
        taskTypes={taskTypes}
      />
    </div>
  );
}
