'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BookOpen, Mic, ChevronRight, Tag, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { AdminHeader } from '@/components/admin/admin-header';
import { listAllPrompts, type PromptInfo } from '@/lib/admin-api';

const SKILL_META: Record<string, { label: string; icon: typeof BookOpen; color: string; bg: string }> = {
  writing: {
    label: 'Writing',
    icon: BookOpen,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
  },
  speaking: {
    label: 'Speaking',
    icon: Mic,
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-100',
  },
};

const FILENAME_LABELS: Record<string, string> = {
  'phase1_parse.txt': 'Phase 1 — Parse Essay (Task 1)',
  'phase1_parse_task2.txt': 'Phase 1 — Parse Essay (Task 2)',
  'phase2_ta.txt': 'Phase 2 — Task Achievement (T1)',
  'phase2_tr.txt': 'Phase 2 — Task Response (T2)',
  'phase3_cc.txt': 'Phase 3 — Coherence & Cohesion',
  'phase4_lr.txt': 'Phase 4 — Lexical Resource',
  'phase5_gra.txt': 'Phase 5 — Grammatical Range',
  'phase7_feedback.txt': 'Phase 7 — Feedback (Task 1)',
  'phase7_feedback_task2.txt': 'Phase 7 — Feedback (Task 2)',
  'phase1_fc.txt': 'Phase 1 — Fluency & Coherence',
  'phase2_lr.txt': 'Phase 2 — Lexical Resource',
  'phase3_gra.txt': 'Phase 3 — Grammatical Range',
  'phase4_pr.txt': 'Phase 4 — Pronunciation',
  'phase5_feedback.txt': 'Phase 5 — Feedback',
};

export default function AdminPromptsPage() {
  const [activeSkill, setActiveSkill] = useState<'all' | 'writing' | 'speaking'>('all');

  const { data: prompts = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-prompts'],
    queryFn: listAllPrompts,
  });

  const filtered = useMemo(
    () => (activeSkill === 'all' ? prompts : prompts.filter((p) => p.skill === activeSkill)),
    [prompts, activeSkill]
  );

  const grouped = useMemo(() => {
    const map: Record<string, PromptInfo[]> = {};
    for (const p of filtered) {
      if (!map[p.skill]) map[p.skill] = [];
      map[p.skill].push(p);
    }
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Quản lý AI Prompts" />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý AI Prompts</h1>
            <p className="text-sm text-gray-500 mt-1">
              Xem, chỉnh sửa và quản lý phiên bản các prompt dùng để chấm điểm IELTS
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>

        {/* Skill filter tabs */}
        <div className="flex gap-2 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm w-fit">
          {(['all', 'writing', 'speaking'] as const).map((skill) => (
            <button
              key={skill}
              onClick={() => setActiveSkill(skill)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeSkill === skill
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {skill === 'all' ? 'Tất cả' : skill === 'writing' ? '📝 Writing' : '🎙️ Speaking'}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tổng prompt', value: prompts.length, icon: Tag, color: 'text-blue-600' },
            {
              label: 'Writing prompts',
              value: prompts.filter((p) => p.skill === 'writing').length,
              icon: BookOpen,
              color: 'text-blue-600',
            },
            {
              label: 'Speaking prompts',
              value: prompts.filter((p) => p.skill === 'speaking').length,
              icon: Mic,
              color: 'text-violet-600',
            },
            {
              label: 'Đã tùy chỉnh',
              value: prompts.filter((p) => p.activeVersion !== 'v1').length,
              icon: CheckCircle2,
              color: 'text-emerald-600',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
            >
              <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Prompt list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Đang tải danh sách prompt...
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([skill, items]) => {
              const meta = SKILL_META[skill];
              const Icon = meta.icon;
              return (
                <div key={skill}>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className={`h-5 w-5 ${meta.color}`} />
                    <h2 className={`text-base font-black uppercase tracking-widest ${meta.color}`}>
                      {meta.label}
                    </h2>
                    <span className="text-xs text-gray-400 font-medium ml-1">
                      ({items.length} prompts)
                    </span>
                  </div>
                  <div className="space-y-3">
                    {items.map((p) => (
                      <Link
                        key={p.path}
                        href={`/admin/prompts/${p.skill}/${encodeURIComponent(p.filename)}`}
                        className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg} border`}
                          >
                            <Icon className={`h-5 w-5 ${meta.color}`} />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {FILENAME_LABELS[p.filename] ?? p.filename}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{p.path}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {p.availableVersions.length > 1 ? (
                            <div className="flex gap-1">
                              {p.availableVersions.slice(-3).map((v) => (
                                <span
                                  key={v}
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                    v === p.activeVersion
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                      : 'bg-gray-100 text-gray-400 border-gray-200'
                                  }`}
                                >
                                  {v}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-bold flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {p.activeVersion}
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
