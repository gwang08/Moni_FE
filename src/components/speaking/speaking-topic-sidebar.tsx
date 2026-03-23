'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarQuestion {
  id: number;
  content: string;
  position: number;
  partNumber?: number;
  questionCategory?: string;
}

interface SpeakingTopicSidebarProps {
  questions: SidebarQuestion[];
  currentIndex: number;
  completedIds: Set<number>;
  onSelect: (index: number) => void;
}

const PART_LABELS: Record<number, string> = {
  1: 'Part 1: Interview',
  2: 'Part 2: Cue Card',
  3: 'Part 3: Discussion',
};

const PART_COLORS: Record<number, { bg: string; text: string; activeBg: string }> = {
  1: { bg: 'from-blue-400 to-blue-500', text: 'text-blue-600', activeBg: 'from-blue-50 to-blue-50/50 border-blue-200/60' },
  2: { bg: 'from-purple-400 to-purple-500', text: 'text-purple-600', activeBg: 'from-purple-50 to-purple-50/50 border-purple-200/60' },
  3: { bg: 'from-emerald-400 to-emerald-500', text: 'text-emerald-600', activeBg: 'from-emerald-50 to-emerald-50/50 border-emerald-200/60' },
};

export function SpeakingTopicSidebar({
  questions,
  currentIndex,
  completedIds,
  onSelect,
}: SpeakingTopicSidebarProps) {
  // Group questions by part, pick the first question as representative
  const parts: { partNum: number; firstQuestion: SidebarQuestion; globalIdx: number; allCompleted: boolean }[] = [];
  const seen = new Set<number>();

  questions.forEach((q, idx) => {
    const part = q.partNumber ?? 1;
    if (seen.has(part)) return;
    seen.add(part);

    // Check if ALL questions in this part are completed
    const partQuestions = questions.filter((qq) => (qq.partNumber ?? 1) === part);
    const allDone = partQuestions.every((qq) => completedIds.has(qq.id));

    parts.push({ partNum: part, firstQuestion: q, globalIdx: idx, allCompleted: allDone });
  });

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-orange-100/60 shadow-sm p-4 space-y-2">
      {parts.map(({ partNum, firstQuestion, globalIdx, allCompleted }) => {
        const colors = PART_COLORS[partNum] || PART_COLORS[1];
        const currentPart = questions[currentIndex]?.partNumber ?? 1;
        const isCurrent = currentPart === partNum;
        const preview = firstQuestion.content.slice(0, 40) + (firstQuestion.content.length > 40 ? '...' : '');

        return (
          <button
            key={partNum}
            onClick={() => onSelect(globalIdx)}
            className={cn(
              'w-full text-left p-3 rounded-2xl transition-all duration-200 group',
              isCurrent && `bg-gradient-to-r ${colors.activeBg} border shadow-sm`,
              !isCurrent && allCompleted && 'bg-green-50/60 hover:bg-green-50 border border-transparent hover:border-green-200/40',
              !isCurrent && !allCompleted && 'hover:bg-orange-50/40 border border-transparent hover:border-orange-100/40',
            )}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className={cn(
                'shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold',
                isCurrent && `bg-gradient-to-br ${colors.bg} text-white shadow-sm`,
                !isCurrent && allCompleted && 'bg-gradient-to-br from-green-400 to-emerald-400 text-white',
                !isCurrent && !allCompleted && 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600',
              )}>
                {allCompleted && !isCurrent ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  partNum
                )}
              </div>
              <span className={cn(
                'text-[11px] font-bold uppercase tracking-wider',
                isCurrent && colors.text,
                !isCurrent && allCompleted && 'text-green-600',
                !isCurrent && !allCompleted && 'text-gray-500',
              )}>
                {PART_LABELS[partNum] || `Part ${partNum}`}
              </span>
            </div>
            <p className={cn(
              'text-[12px] leading-snug ml-8.5 pl-0.5',
              isCurrent && 'text-gray-700 font-medium',
              !isCurrent && 'text-gray-500',
            )}>
              {preview}
            </p>
          </button>
        );
      })}
    </div>
  );
}
