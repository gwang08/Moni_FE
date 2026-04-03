'use client';

import { useState } from 'react';
import { BookOpen, Mic, Send, ChevronLeft, ChevronRight, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StimulusRequest } from '@/types/admin.types';

interface Props {
  stimuli: StimulusRequest[];
}

type PreviewScreen =
  | { type: 'part1'; questionIdx: number }
  | { type: 'transition'; part: 2 | 3; text: string }
  | { type: 'cuecard'; topic: string }
  | { type: 'part2speaking' }
  | { type: 'part3'; questionIdx: number };

export function SpeakingExamPreview({ stimuli }: Props) {
  const screens = buildScreens(stimuli);
  const [currentIdx, setCurrentIdx] = useState(0);

  if (screens.length === 0) {
    return <p className="text-sm text-gray-400 italic text-center py-8">Chưa có nội dung để xem trước</p>;
  }

  const screen = screens[currentIdx];
  const canPrev = currentIdx > 0;
  const canNext = currentIdx < screens.length - 1;

  return (
    <div className="space-y-4">
      {/* Phone frame */}
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border-2 border-gray-300 bg-gray-50 overflow-hidden shadow-lg">
          {/* Status bar */}
          <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
            <span className="text-white text-xs font-medium">IELTS Speaking Exam</span>
            <span className="text-gray-400 text-[10px]">Xem trước</span>
          </div>

          {/* Content */}
          <div className="bg-white p-6 min-h-[360px] flex flex-col justify-center">
            {screen.type === 'part1' && <Part1Screen questions={getPartQuestions(stimuli, 0)} questionIdx={screen.questionIdx} />}
            {screen.type === 'transition' && <TransitionPreview part={screen.part} text={screen.text} />}
            {screen.type === 'cuecard' && <CueCardPreview topic={screen.topic} />}
            {screen.type === 'part2speaking' && <Part2SpeakingPreview />}
            {screen.type === 'part3' && <Part3Screen questions={getPartQuestions(stimuli, 2)} questionIdx={screen.questionIdx} />}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => setCurrentIdx(currentIdx - 1)} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Trước
        </Button>
        <span className="text-xs text-gray-400">{currentIdx + 1} / {screens.length}</span>
        <Button variant="outline" size="sm" disabled={!canNext} onClick={() => setCurrentIdx(currentIdx + 1)} className="gap-1">
          Sau <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ── Screen builders ── */

function getPartQuestions(stimuli: StimulusRequest[], partIdx: number) {
  const qs = stimuli[partIdx]?.questionGroups[0]?.questions || [];
  return qs.filter(q => (q.position ?? 0) > 0);
}

function getStimulusPartNumber(stimulus: StimulusRequest | undefined, fallback: number): 1 | 2 | 3 {
  const code = stimulus?.questionGroups[0]?.questionTypeCode;
  if (code === 'SPEAKING_PART_2' || stimulus?.section === 2) return 2;
  if (code === 'SPEAKING_PART_3' || stimulus?.section === 3) return 3;
  if (code === 'SPEAKING_PART_1' || stimulus?.section === 1) return 1;
  return fallback as 1 | 2 | 3;
}

function buildScreens(stimuli: StimulusRequest[]): PreviewScreen[] {
  const screens: PreviewScreen[] = [];
  if (stimuli.length === 0) return screens;

  if (stimuli.length === 1) {
    const stimulus = stimuli[0];
    const part = getStimulusPartNumber(stimulus, 1);
    const questions = getPartQuestions(stimuli, 0);

    if (part === 1) {
      questions.forEach((_, i) => screens.push({ type: 'part1', questionIdx: i }));
      return screens;
    }

    if (part === 2) {
      const transition = stimulus.questionGroups[0]?.questions.find(q => q.position === 0);
      if (transition) screens.push({ type: 'transition', part: 2, text: transition.content });
      const cueCard = stimulus.questionGroups[0]?.questions.find(q => q.position === 1);
      if (cueCard) screens.push({ type: 'cuecard', topic: cueCard.content });
      screens.push({ type: 'part2speaking' });
      return screens;
    }

    const transition = stimulus.questionGroups[0]?.questions.find(q => q.position === 0);
    if (transition) screens.push({ type: 'transition', part: 3, text: transition.content });
    questions.forEach((_, i) => screens.push({ type: 'part3', questionIdx: i }));
    return screens;
  }

  // Part 1 questions
  const p1Qs = getPartQuestions(stimuli, 0);
  p1Qs.forEach((_, i) => screens.push({ type: 'part1', questionIdx: i }));

  // Part 2 transition
  const p2Transition = stimuli[1]?.questionGroups[0]?.questions.find(q => q.position === 0);
  if (p2Transition) screens.push({ type: 'transition', part: 2, text: p2Transition.content });

  // Part 2 cue card
  const cueCard = stimuli[1]?.questionGroups[0]?.questions.find(q => q.position === 1);
  if (cueCard) screens.push({ type: 'cuecard', topic: cueCard.content });

  // Part 2 speaking
  screens.push({ type: 'part2speaking' });

  // Part 3 transition
  const p3Transition = stimuli[2]?.questionGroups[0]?.questions.find(q => q.position === 0);
  if (p3Transition) screens.push({ type: 'transition', part: 3, text: p3Transition.content });

  // Part 3 questions
  const p3Qs = getPartQuestions(stimuli, 2);
  p3Qs.forEach((_, i) => screens.push({ type: 'part3', questionIdx: i }));

  return screens;
}

/* ── Preview sub-components ── */

function Part1Screen({ questions, questionIdx }: { questions: { content: string; questionCategory?: string }[]; questionIdx: number }) {
  const q = questions[questionIdx];
  if (!q) return null;
  const isFollowUp = q.questionCategory === 'FOLLOW_UP';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">Part 1</span>
        {isFollowUp && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <CornerDownRight className="h-3 w-3" /> Câu hỏi bổ sung
          </span>
        )}
      </div>
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
        <p className="text-base leading-relaxed text-gray-800">
          {isFollowUp && <span className="mr-1 text-blue-500">↳</span>}
          {q.content}
        </p>
      </div>
      <MockMicArea />
    </div>
  );
}

function Part3Screen({ questions, questionIdx }: { questions: { content: string; questionCategory?: string }[]; questionIdx: number }) {
  const q = questions[questionIdx];
  if (!q) return null;
  const isFollowUp = q.questionCategory === 'FOLLOW_UP';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">Part 3</span>
        {isFollowUp && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <CornerDownRight className="h-3 w-3" /> Câu hỏi bổ sung
          </span>
        )}
      </div>
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
        <p className="text-base leading-relaxed text-gray-800">
          {isFollowUp && <span className="mr-1 text-blue-500">↳</span>}
          {q.content}
        </p>
      </div>
      <MockMicArea />
    </div>
  );
}

function TransitionPreview({ part, text }: { part: 2 | 3; text: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-600">
        Chuyển sang Part {part}
      </span>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm leading-relaxed text-gray-600 italic">{text}</p>
      </div>
      <p className="text-xs text-gray-400">Giám khảo AI sẽ đọc câu này</p>
    </div>
  );
}

function CueCardPreview({ topic }: { topic: string }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700">
          Part 2 — Cue Card
        </span>
      </div>
      <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6">
        <div className="mb-3 flex items-center gap-2 text-purple-600">
          <BookOpen className="h-5 w-5" />
          <span className="text-sm font-medium">Chủ đề</span>
        </div>
        <p className="text-base leading-relaxed whitespace-pre-line text-gray-800">{topic}</p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-gray-500">Thời gian chuẩn bị</p>
        <div className="text-3xl font-bold tabular-nums text-purple-700">1:00</div>
      </div>
    </div>
  );
}

function Part2SpeakingPreview() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
          Part 2 — Đang nói
        </span>
        <div className="flex items-center gap-1 text-red-500">
          <Mic className="h-4 w-4" />
          <span className="text-xs font-medium">REC</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-gray-500">Thời gian còn lại</p>
        <div className="text-4xl font-bold tabular-nums text-green-700">2:00</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 min-h-[60px]">
        <p className="text-sm text-gray-400 italic">Transcript sẽ hiện ở đây khi thí sinh nói...</p>
      </div>
      <div className="flex justify-center">
        <Button variant="destructive" size="sm" className="gap-2 pointer-events-none opacity-70">
          Dừng nói
        </Button>
      </div>
    </div>
  );
}

function MockMicArea() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 min-h-[48px]">
        <p className="text-sm text-gray-400 italic">Transcript hiện ở đây khi thí sinh trả lời...</p>
      </div>
      <Button className="gap-2 pointer-events-none opacity-70" size="sm">
        <Send className="h-4 w-4" /> Gửi câu trả lời
      </Button>
    </div>
  );
}
