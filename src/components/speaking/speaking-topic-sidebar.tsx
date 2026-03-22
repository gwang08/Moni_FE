'use client';

import { CheckCircle2, CornerDownRight } from 'lucide-react';
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

const PART_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'from-blue-400 to-blue-500', text: 'text-blue-600', border: 'border-blue-200/60' },
  2: { bg: 'from-purple-400 to-purple-500', text: 'text-purple-600', border: 'border-purple-200/60' },
  3: { bg: 'from-emerald-400 to-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200/60' },
};

export function SpeakingTopicSidebar({
  questions,
  currentIndex,
  completedIds,
  onSelect,
}: SpeakingTopicSidebarProps) {
  // Group questions by part
  const parts = new Map<number, { questions: (SidebarQuestion & { globalIdx: number })[] }>();
  questions.forEach((q, idx) => {
    const part = q.partNumber ?? 1;
    if (!parts.has(part)) parts.set(part, { questions: [] });
    parts.get(part)!.questions.push({ ...q, globalIdx: idx });
  });

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-orange-100/60 shadow-sm p-4 space-y-4">
      {[...parts.entries()].map(([partNum, { questions: partQs }]) => {
        const colors = PART_COLORS[partNum] || PART_COLORS[1];
        return (
          <div key={partNum}>
            <div className={`flex items-center gap-2 pb-2 mb-2 border-b ${colors.border}`}>
              <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
                <span className="text-[9px] font-bold text-white">{partNum}</span>
              </div>
              <h3 className={`text-[11px] font-bold uppercase tracking-wider ${colors.text}`}>
                {PART_LABELS[partNum] || `Part ${partNum}`}
              </h3>
            </div>

            <ul className="space-y-1.5">
              {partQs.map((q) => {
                const isCurrent = q.globalIdx === currentIndex;
                const isCompleted = completedIds.has(q.id);
                const isFollowUp = q.questionCategory === 'FOLLOW_UP';
                const preview = q.content.slice(0, 32) + (q.content.length > 32 ? '...' : '');

                return (
                  <li key={q.id}>
                    <button
                      onClick={() => onSelect(q.globalIdx)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-2xl text-sm transition-all duration-200 flex items-start gap-2.5 group',
                        isFollowUp && 'ml-3',
                        isCurrent && 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 shadow-sm shadow-orange-100/30',
                        !isCurrent && isCompleted && 'bg-green-50/60 hover:bg-green-50 border border-transparent hover:border-green-200/40',
                        !isCurrent && !isCompleted && 'hover:bg-orange-50/40 border border-transparent hover:border-orange-100/40'
                      )}
                    >
                      <div className={cn(
                        'shrink-0 w-6 h-6 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all duration-200',
                        isCurrent && 'bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow-sm shadow-orange-300/30',
                        !isCurrent && isCompleted && 'bg-gradient-to-br from-green-400 to-emerald-400 text-white',
                        !isCurrent && !isCompleted && 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600'
                      )}>
                        {isCompleted && !isCurrent ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : isFollowUp ? (
                          <CornerDownRight className="h-3 w-3" />
                        ) : (
                          q.position
                        )}
                      </div>
                      <span className={cn(
                        'flex-1 leading-snug text-[13px]',
                        isCurrent && 'text-orange-800 font-medium',
                        !isCurrent && isCompleted && 'text-green-700',
                        !isCurrent && !isCompleted && 'text-gray-600'
                      )}>
                        {preview}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
