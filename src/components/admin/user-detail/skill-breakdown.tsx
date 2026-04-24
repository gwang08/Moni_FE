'use client';

import { BookOpen, Headphones, Pencil, Mic } from 'lucide-react';
import type { AttemptHistory } from '@/lib/practice-api';
import type { WritingSubmission } from '@/lib/ai-api';
import type { ScoringSession } from '@/types/expert.types';

interface Props {
  attempts: AttemptHistory[];
  writing: WritingSubmission[];
  sessions: ScoringSession[];
}

const SKILLS = [
  { key: 'READING', label: 'Reading', icon: BookOpen },
  { key: 'LISTENING', label: 'Listening', icon: Headphones },
  { key: 'WRITING', label: 'Writing', icon: Pencil },
  { key: 'SPEAKING', label: 'Speaking', icon: Mic },
] as const;

function computeSkillStats(skill: string, attempts: AttemptHistory[], writing: WritingSubmission[], sessions: ScoringSession[]) {
  let count = 0;
  let correctSum = 0;
  let totalSum = 0;

  attempts.filter((a) => a.skill === skill).forEach((a) => {
    count++;
    if (a.totalQuestions > 0) {
      correctSum += a.score;
      totalSum += a.totalQuestions;
    }
  });

  if (skill === 'WRITING') count += writing.length;
  if (skill === 'SPEAKING') count += sessions.filter((s) => s.skill === 'SPEAKING').length;
  if (skill === 'WRITING') count += sessions.filter((s) => s.skill === 'WRITING').length;

  const pct = totalSum > 0 ? Math.round((correctSum / totalSum) * 100) : null;
  return { count, pct };
}

export function SkillBreakdown({ attempts, writing, sessions }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Theo kỹ năng</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SKILLS.map(({ key, label, icon: Icon }) => {
          const { count, pct } = computeSkillStats(key, attempts, writing, sessions);
          return (
            <div key={key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
              <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-xs text-gray-500">{count} bài</span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: pct != null ? `${pct}%` : '0%' }}
                  />
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  {pct != null ? `TB ${pct}% đúng` : 'Chưa có điểm'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
