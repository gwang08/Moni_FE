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
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 border-b">
        Danh sách câu hỏi
      </h3>

      <ul className="space-y-1">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isCompleted = completedIds.has(q.id);
          const preview = q.content.slice(0, 40) + (q.content.length > 40 ? '…' : '');

          return (
            <li key={q.id}>
              <button
                onClick={() => onSelect(idx)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-start gap-2',
                  isCurrent && 'bg-orange-50 border border-orange-300 text-orange-800',
                  !isCurrent && isCompleted && 'bg-green-50 text-green-700 hover:bg-green-100',
                  !isCurrent && !isCompleted && 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <span className="shrink-0 font-medium w-5 text-right">
                  {q.position}.
                </span>
                <span className="flex-1 leading-snug">{preview}</span>
                {isCompleted && !isCurrent && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
