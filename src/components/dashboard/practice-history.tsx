'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Headphones, Pencil, Mic, Clock } from 'lucide-react';
import Link from 'next/link';
import { getAttemptHistory } from '@/lib/practice-api';
import type { AttemptHistory } from '@/lib/practice-api';
import type { SkillKey } from '@/types';
import { SkeletonCard } from '@/components/ui/skeleton';

const TABS: { key: SkillKey; label: string; icon: React.ReactNode; skill: string }[] = [
  { key: 'reading', label: 'Reading', icon: <BookOpen className="h-3.5 w-3.5" />, skill: 'READING' },
  { key: 'listening', label: 'Listening', icon: <Headphones className="h-3.5 w-3.5" />, skill: 'LISTENING' },
  { key: 'writing', label: 'Writing', icon: <Pencil className="h-3.5 w-3.5" />, skill: 'WRITING' },
  { key: 'speaking', label: 'Speaking', icon: <Mic className="h-3.5 w-3.5" />, skill: 'SPEAKING' },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-5">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-inner">
        <div className="text-5xl select-none">📝</div>
      </div>
      <div className="text-center space-y-2 max-w-xs">
        <p className="text-sm text-gray-500 leading-relaxed">
          Bạn hiện chưa làm bài tập nào!<br />
          Hãy chọn dạng phù hợp và luyện tập ngay nào!
        </p>
      </div>
      <Link
        href="/practice"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-sm"
      >
        Tiến hành làm bài tập ngay
      </Link>
    </div>
  );
}

function AttemptCard({ attempt }: { attempt: AttemptHistory }) {
  const percentage = attempt.totalQuestions > 0
    ? Math.round((attempt.score / attempt.totalQuestions) * 100)
    : 0;
  const skillPath = attempt.skill?.toLowerCase() ?? 'reading';
  const reviewUrl = attempt.stimulusId
    ? `/practice/${skillPath}/${attempt.stimulusId}`
    : '#';

  return (
    <Link
      href={reviewUrl}
      className="flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {attempt.stimulusTitle || 'Bài tập'}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span>{formatDate(attempt.submittedAt)}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(attempt.elapsedSeconds)}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className={`text-sm font-bold ${percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
          {attempt.score}/{attempt.totalQuestions}
        </p>
        <p className="text-xs text-gray-400">{percentage}%</p>
      </div>
    </Link>
  );
}

export function PracticeHistory() {
  const [activeTab, setActiveTab] = useState<SkillKey>('reading');
  const [attempts, setAttempts] = useState<AttemptHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getAttemptHistory();
        setAttempts(data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  const activeSkill = TABS.find((t) => t.key === activeTab)?.skill ?? 'READING';
  const filtered = attempts.filter((a) => a.skill === activeSkill);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Lịch sử làm bài</h3>

      {/* Skill Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonCard className="h-40" />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((attempt) => (
            <AttemptCard key={attempt.attemptId} attempt={attempt} />
          ))}
        </div>
      )}
    </div>
  );
}
