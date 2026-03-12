'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarQuestion {
  id: number;
  content: string;
  position: number;
}

interface SpeakingTopicSidebarProps {
  questions: SidebarQuestion[];
  currentIndex: number;
  completedIds: Set<number>;
  onSelect: (index: number) => void;
}

export function SpeakingTopicSidebar({
  questions,
  currentIndex,
  completedIds,
  onSelect,
}: SpeakingTopicSidebarProps) {
  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-orange-100/60 shadow-sm p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-3 mb-3 border-b border-orange-100/40 flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
          <span className="text-[9px] font-bold text-orange-600">#</span>
        </div>
        {'Câu hỏi'}
      </h3>

      <ul className="space-y-1.5">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isCompleted = completedIds.has(q.id);
          const preview = q.content.slice(0, 36) + (q.content.length > 36 ? '...' : '');

          return (
            <li key={q.id}>
              <button
                onClick={() => onSelect(idx)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-2xl text-sm transition-all duration-200 flex items-start gap-2.5 group',
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
}
