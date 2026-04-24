'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Headphones, Pencil, Mic, Search, Bot, GraduationCap, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { AttemptHistory } from '@/lib/practice-api';
import type { WritingSubmission } from '@/lib/ai-api';
import type { ScoringSession } from '@/types/expert.types';

interface Props {
  attempts: AttemptHistory[];
  writing: WritingSubmission[];
  sessions: ScoringSession[];
}

type SkillFilter = 'ALL' | 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING';
type SourceFilter = 'ALL' | 'practice' | 'ai' | 'expert';

const SKILLS: { key: SkillFilter; label: string; icon: React.ComponentType<{ className?: string }> | null }[] = [
  { key: 'ALL', label: 'Tất cả', icon: null },
  { key: 'READING', label: 'Reading', icon: BookOpen },
  { key: 'LISTENING', label: 'Listening', icon: Headphones },
  { key: 'WRITING', label: 'Writing', icon: Pencil },
  { key: 'SPEAKING', label: 'Speaking', icon: Mic },
];

interface Row {
  key: string;
  date: string;
  title: string;
  skill: string;
  source: 'practice' | 'ai' | 'expert';
  score: string;
  duration: string;
  status?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDuration(sec: number) {
  if (sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TabAttempts({ attempts, writing, sessions }: Props) {
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('ALL');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [search, setSearch] = useState('');

  const rows = useMemo<Row[]>(() => {
    const all: Row[] = [];

    attempts.forEach((a) => {
      const dt = a.submittedAt ?? a.startedAt;
      if (!dt) return;
      all.push({
        key: `a-${a.attemptId}`,
        date: dt,
        title: a.testTitle ?? a.stimulusTitle ?? 'Bài tập',
        skill: a.skill ?? 'READING',
        source: 'practice',
        score: a.totalQuestions > 0 ? `${a.score}/${a.totalQuestions}` : '—',
        duration: formatDuration(a.elapsedSeconds),
      });
    });

    writing.forEach((w) => {
      all.push({
        key: `w-${w.submissionId}`,
        date: w.submittedAt,
        title: w.testTitle ?? w.stimulusTitle ?? `Writing ${w.taskType === 'TASK_1' ? 'Task 1' : 'Task 2'}`,
        skill: 'WRITING',
        source: 'ai',
        score: w.overallBand != null ? `Band ${w.overallBand.toFixed(1)}` : '—',
        duration: '—',
        status: w.evaluationStatus,
      });
    });

    sessions.forEach((s) => {
      const dt = s.createdAt ?? s.submittedAt;
      if (!dt) return;
      all.push({
        key: `s-${s.id}`,
        date: dt,
        title: s.testTitle ?? s.stimulusTitle ?? `Phiên #${s.id}`,
        skill: s.skill,
        source: 'expert',
        score: '—',
        duration: '—',
        status: s.status,
      });
    });

    return all
      .filter((r) => skillFilter === 'ALL' || r.skill === skillFilter)
      .filter((r) => sourceFilter === 'ALL' || r.source === sourceFilter)
      .filter((r) => !search.trim() || r.title.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attempts, writing, sessions, skillFilter, sourceFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên bài..."
            className="pl-9 h-9"
          />
        </div>

        <div className="flex gap-1 flex-wrap">
          {SKILLS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSkillFilter(key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                skillFilter === key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(['ALL', 'practice', 'ai', 'expert'] as SourceFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                sourceFilter === s
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'text-gray-500 border border-transparent hover:bg-gray-100'
              }`}
            >
              {s === 'ALL' ? 'Mọi nguồn' : s === 'practice' ? 'Practice' : s === 'ai' ? 'AI' : 'Expert'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Không tìm thấy bài nào phù hợp</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50/60 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Bài</th>
                <th className="px-4 py-3 text-left">Kỹ năng</th>
                <th className="px-4 py-3 text-left">Nguồn</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
                <th className="px-4 py-3 text-left">Điểm</th>
                <th className="px-4 py-3 text-left">Ngày</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={r.key} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-gray-800 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-md">{r.title}</span>
                      {r.status && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {r.status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{r.skill}</td>
                  <td className="px-4 py-2.5">
                    {r.source === 'practice' && <span className="text-xs text-gray-500">Practice</span>}
                    {r.source === 'ai' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        <Bot className="h-2.5 w-2.5" />AI
                      </span>
                    )}
                    {r.source === 'expert' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <GraduationCap className="h-2.5 w-2.5" />Expert
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">
                    {r.duration !== '—' ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {r.duration}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-emerald-600">{r.score}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{formatDate(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
