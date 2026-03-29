'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { BookOpen, Headphones, Pencil, Mic, Clock, ArrowUpDown, Filter, GraduationCap, Bot } from 'lucide-react';
import Link from 'next/link';
import type { AttemptHistory } from '@/lib/practice-api';
import { getMySessions } from '@/lib/expert-api';
import { getWritingSubmissions, type WritingSubmission } from '@/lib/ai-api';
import type { ScoringSession } from '@/types/expert.types';
import type { SkillKey } from '@/types';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useAttemptHistory } from '@/hooks/use-attempt-history';

const TABS: { key: SkillKey; label: string; icon: React.ReactNode; skill: string }[] = [
  { key: 'reading', label: 'Reading', icon: <BookOpen className="h-3.5 w-3.5" />, skill: 'READING' },
  { key: 'listening', label: 'Listening', icon: <Headphones className="h-3.5 w-3.5" />, skill: 'LISTENING' },
  { key: 'writing', label: 'Writing', icon: <Pencil className="h-3.5 w-3.5" />, skill: 'WRITING' },
  { key: 'speaking', label: 'Speaking', icon: <Mic className="h-3.5 w-3.5" />, skill: 'SPEAKING' },
];

type SortOrder = 'newest' | 'oldest';
type ScoreFilter = 'all' | 'high' | 'mid' | 'low';

interface UnifiedEntry {
  id: string;
  title: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  elapsedSeconds: number;
  reviewUrl: string;
  source: 'ai' | 'expert';
  status?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

function EntryCard({ entry }: { entry: UnifiedEntry }) {
  const isSpeakingExpert = entry.source === 'expert';

  return (
    <Link
      href={entry.reviewUrl}
      className="flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800 truncate">{entry.title}</p>
          {isSpeakingExpert && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">
              <GraduationCap className="h-2.5 w-2.5" /> Giảng viên
            </span>
          )}
          {entry.source === 'ai' && entry.id.startsWith('speaking-') && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
              <Bot className="h-2.5 w-2.5" /> AI
            </span>
          )}
          {entry.id.startsWith('writing-sub-') && entry.status && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              entry.status === 'Đã chấm' ? 'bg-green-100 text-green-700' :
              entry.status === 'Đang chấm' ? 'bg-blue-100 text-blue-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {entry.status}
            </span>
          )}
          {isSpeakingExpert && entry.status && entry.status !== 'COMPLETED' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              entry.status === 'QUEUED' ? 'bg-yellow-100 text-yellow-700' :
              entry.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {entry.status === 'QUEUED' ? 'Đang chờ' : entry.status === 'IN_PROGRESS' ? 'Đang diễn ra' : 'Đã huỷ'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span>{formatDate(entry.date)}</span>
          {entry.elapsedSeconds > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(entry.elapsedSeconds)}
            </span>
          )}
        </div>
      </div>
      {entry.total > 0 && (
        <div className="flex-shrink-0 text-right">
          <p className={`text-sm font-bold ${entry.percentage >= 70 ? 'text-green-600' : entry.percentage >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
            {entry.score}/{entry.total}
          </p>
          <p className="text-xs text-gray-400">{entry.percentage}%</p>
        </div>
      )}
    </Link>
  );
}

function toUnifiedAttempt(a: AttemptHistory, skill: string): UnifiedEntry {
  const percentage = a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 100) : 0;
  const skillPath = a.skill?.toLowerCase() ?? 'reading';
  const testOrStimulusId = a.testId ?? a.stimulusId;
  return {
    id: `${skill}-${a.attemptId}`,
    title: a.stimulusTitle || 'Bài tập',
    date: a.submittedAt,
    score: a.score,
    total: a.totalQuestions,
    percentage,
    elapsedSeconds: a.elapsedSeconds,
    reviewUrl: testOrStimulusId ? `/practice/${skillPath}/${testOrStimulusId}/review?attemptId=${a.attemptId}` : '#',
    source: 'ai',
  };
}

function toUnifiedWritingSub(s: WritingSubmission): UnifiedEntry {
  const statusLabel = s.evaluationStatus === 'COMPLETED' ? 'Đã chấm'
    : s.evaluationStatus === 'PROCESSING' ? 'Đang chấm'
    : 'Chưa chấm';
  return {
    id: `writing-sub-${s.submissionId}`,
    title: `Writing ${s.taskType === 'TASK_1' ? 'Task 1' : 'Task 2'}`,
    date: s.submittedAt,
    score: 0,
    total: 0,
    percentage: 0,
    elapsedSeconds: 0,
    reviewUrl: '/scoring-history',
    source: 'ai',
    status: statusLabel,
  };
}

function toUnifiedSession(s: ScoringSession): UnifiedEntry {
  return {
    id: `expert-${s.id}`,
    title: `Phiên #${s.id} — ${s.expertDisplayName}`,
    date: s.createdAt ?? new Date().toISOString(),
    score: 0,
    total: 0,
    percentage: 0,
    elapsedSeconds: 0,
    reviewUrl: '/scoring-history',
    source: 'expert',
    status: s.status,
  };
}

export function PracticeHistory() {
  const [activeTab, setActiveTab] = useState<SkillKey>('reading');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');
  const { attempts, loading } = useAttemptHistory();

  // Fetch expert sessions + writing submissions
  const [expertSessions, setExpertSessions] = useState<ScoringSession[]>([]);
  const [expertLoading, setExpertLoading] = useState(true);
  const [writingSubs, setWritingSubs] = useState<WritingSubmission[]>([]);
  const [writingSubsLoading, setWritingSubsLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    getMySessions()
      .then(setExpertSessions)
      .catch(() => {})
      .finally(() => setExpertLoading(false));
    getWritingSubmissions()
      .then(setWritingSubs)
      .catch(() => {})
      .finally(() => setWritingSubsLoading(false));
  }, []);

  const activeSkill = TABS.find((t) => t.key === activeTab)?.skill ?? 'READING';

  const entries = useMemo(() => {
    // Practice attempts for this skill
    const practiceEntries = attempts
      .filter((a) => a.skill === activeSkill)
      .map((a) => toUnifiedAttempt(a, activeSkill.toLowerCase()));

    let allEntries = practiceEntries;

    // Add writing submissions for writing tab
    if (activeTab === 'writing') {
      const writingEntries = writingSubs.map(toUnifiedWritingSub);
      allEntries = [...practiceEntries, ...writingEntries];
    }

    // Add expert sessions for speaking tab
    if (activeTab === 'speaking') {
      const expertEntries = expertSessions
        .filter((s) => s.skill === 'SPEAKING')
        .map(toUnifiedSession);
      allEntries = [...practiceEntries, ...expertEntries];
    }

    // Sort
    allEntries.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });

    // Score filter
    if (scoreFilter !== 'all') {
      allEntries = allEntries.filter((e) => {
        if (e.total === 0) return true; // expert sessions have no score — always show
        if (scoreFilter === 'high') return e.percentage >= 70;
        if (scoreFilter === 'mid') return e.percentage >= 40 && e.percentage < 70;
        return e.percentage < 40;
      });
    }

    return allEntries;
  }, [attempts, expertSessions, writingSubs, activeSkill, activeTab, sortOrder, scoreFilter]);

  const isLoading = loading || (activeTab === 'speaking' && expertLoading) || (activeTab === 'writing' && writingSubsLoading);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Lịch sử làm bài</h3>

      {/* Skill Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setScoreFilter('all'); }}
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

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortOrder === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
        </button>

        <div className="flex items-center gap-1">
          <Filter className="h-3 w-3 text-gray-400" />
          {(['all', 'high', 'mid', 'low'] as ScoreFilter[]).map((f) => {
            const label = f === 'all' ? 'Tất cả' : f === 'high' ? '≥70%' : f === 'mid' ? '40-69%' : '<40%';
            return (
              <button
                key={f}
                onClick={() => setScoreFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  scoreFilter === f
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonCard className="h-40" />
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
