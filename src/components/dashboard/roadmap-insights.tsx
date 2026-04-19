'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, TriangleAlert, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { getRoadmapInsights } from '@/lib/roadmap-api';
import type { LearnerRoadmapInsights, LearnerTagMetric } from '@/types/roadmap.types';

/* ─────────────────── Helpers ─────────────────── */

function fmtBand(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val) || val < 0) return '—';
  return val.toFixed(1);
}

function fmtPct01(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val)) return '—';
  const pct = Math.max(0, Math.min(1, val)) * 100;
  return `${Math.round(pct)}%`;
}

function fmtDateYmd(date: string | null | undefined): string {
  if (!date) return '—';
  return date.split('T')[0] ?? '—';
}

function clamp01(val: number | null | undefined): number {
  if (val == null || Number.isNaN(val) || !Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(1, val));
}

/* ─────────────────── Skill ↔ TagType mapping ─────────────────── */

type SkillTab = 'reading' | 'listening' | 'writing' | 'speaking';

const SKILL_TABS: { key: SkillTab; label: string }[] = [
  { key: 'reading', label: 'Kỹ năng Đọc' },
  { key: 'listening', label: 'Kỹ năng Nghe' },
  { key: 'writing', label: 'Kỹ năng Viết' },
  { key: 'speaking', label: 'Kỹ năng Nói' },
];

/** Map tagType to which skill tabs it should appear in */
const TAG_TYPE_TO_SKILLS: Record<string, SkillTab[]> = {
  QUESTION_TYPE: ['reading', 'listening'],
  PASSAGE: ['reading'],
  SECTION: ['listening'],
  TASK: ['writing'],
  WRITING_TYPE: ['writing'],
  WRITING_CRITERIA: ['writing'],
  PART: ['speaking'],
  TOPIC: ['speaking'],
  SPEAKING_CRITERIA: ['speaking'],
};

const TAG_TYPE_LABELS: Record<string, string> = {
  QUESTION_TYPE: 'Dạng bài (Question Types)',
  TOPIC: 'Chủ đề (Topics)',
  DIFFICULTY: 'Độ khó (Difficulty)',
  WRITING_TYPE: 'Dạng bài viết (Writing Types)',
  WRITING_TOPIC: 'Chủ đề bài viết (Writing Topics)',
  WRITING_CRITERIA: 'Tiêu chí chấm điểm (Scoring Criteria)',
  SPEAKING_CRITERIA: 'Tiêu chí chấm điểm (Scoring Criteria)',
  PASSAGE: 'Passage',
  SECTION: 'Section',
  TASK: 'Task',
  PART: 'Part',
  SKILL: 'Kỹ năng',
};

function getTagTypeLabel(tagType: string): string {
  return TAG_TYPE_LABELS[tagType] || tagType;
}

const CRITERIA_TAG_TYPES = new Set(['WRITING_CRITERIA', 'SPEAKING_CRITERIA']);

function getSkillsForMetric(m: LearnerTagMetric): SkillTab[] {
  // For criteria tags, always use tagType mapping (skill field may be wrong)
  if (m.tagType && CRITERIA_TAG_TYPES.has(m.tagType) && TAG_TYPE_TO_SKILLS[m.tagType]) {
    return TAG_TYPE_TO_SKILLS[m.tagType];
  }
  // For other tags (QUESTION_TYPE, etc.), use skill field to avoid cross-tab leaking
  if (m.skill) {
    const rawSkill = m.skill.toLowerCase() as SkillTab;
    return [rawSkill];
  }
  if (m.tagType && TAG_TYPE_TO_SKILLS[m.tagType]) {
    return TAG_TYPE_TO_SKILLS[m.tagType];
  }
  return [];
}

/* ─────────────────── UI Components ─────────────────── */

function MetricBar({
  label,
  value01,
  accent,
}: {
  label: string;
  value01: number | null | undefined;
  accent: 'amber' | 'sky' | 'emerald';
}) {
  const v = clamp01(value01);
  const bar =
    accent === 'sky'
      ? 'from-sky-500 to-indigo-500'
      : accent === 'emerald'
        ? 'from-emerald-500 to-lime-500'
        : 'from-amber-500 to-rose-500';
  const glow =
    accent === 'sky'
      ? 'shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_10px_30px_-14px_rgba(59,130,246,0.45)]'
      : accent === 'emerald'
        ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_10px_30px_-14px_rgba(34,197,94,0.40)]'
        : 'shadow-[0_0_0_1px_rgba(245,158,11,0.25),0_10px_30px_-14px_rgba(244,63,94,0.40)]';

  return (
    <div className="rounded-xl border border-gray-100 bg-white/70 backdrop-blur px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <div className="text-xs font-semibold text-gray-700 font-mono">{fmtPct01(value01)}</div>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${bar} ${glow} transition-all duration-700`}
          style={{ width: `${Math.round(v * 100)}%` }}
        />
      </div>
    </div>
  );
}

const CRITERIA_VI_LABELS: Record<string, string> = {
  // Writing criteria
  'Task Response': 'Trả lời đúng yêu cầu đề bài',
  'Task Achievement': 'Trả lời đúng yêu cầu đề bài',
  'Coherence and Cohesion': 'Tính mạch lạc và liên kết',
  'Coherence & Cohesion': 'Tính mạch lạc và liên kết',
  'Lexical Resource': 'Nguồn từ vựng',
  'Grammatical Range': 'Phạm vi ngữ pháp',
  'Grammatical Range and Accuracy': 'Phạm vi và độ chính xác ngữ pháp',
  // Speaking criteria
  'Fluency and Coherence': 'Độ trôi chảy và mạch lạc',
  'Fluency & Coherence': 'Độ trôi chảy và mạch lạc',
  'Pronunciation': 'Phát âm',
};

function getDisplayName(m: LearnerTagMetric): string {
  const name = m.tagName || m.tagCode || 'Unknown tag';
  return CRITERIA_VI_LABELS[name] || name;
}

function TagRow({ m }: { m: LearnerTagMetric }) {
  const mastery = clamp01(m.masteryLevel);
  const conf = clamp01(m.confidenceScore);
  const isWeak = mastery < 0.5;

  return (
    <div className={`rounded-lg border px-3 py-2 ${isWeak ? 'border-rose-100 bg-rose-50/30' : 'border-gray-100 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-800 truncate">
            {getDisplayName(m)}
          </div>
          <div className="text-[11px] text-gray-400">
            {m.updatedAt ? fmtDateYmd(m.updatedAt) : 'Chưa có dữ liệu'}
          </div>
        </div>
        <div className="flex-shrink-0 text-right font-mono">
          <div className={`text-[11px] ${isWeak ? 'text-rose-600 font-semibold' : 'text-gray-500'}`}>
            M {Math.round(mastery * 100)}%
          </div>
          <div className="text-[11px] text-gray-500">C {Math.round(conf * 100)}%</div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${isWeak ? 'from-rose-400 to-orange-400' : 'from-sky-500 to-indigo-500'}`}
            style={{ width: `${Math.round(mastery * 100)}%` }}
          />
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500" style={{ width: `${Math.round(conf * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

function TagGroupAccordion({
  group,
  defaultOpen,
}: {
  group: { type: string; label: string; items: LearnerTagMetric[] };
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const weakCount = group.items.filter(m => clamp01(m.masteryLevel) < 0.5).length;

  return (
    <div className="rounded-lg border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50/70 hover:bg-gray-100/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          {open ? '▼' : '►'} {group.label}
          <span className="text-gray-400 font-normal">— {group.items.length} mục</span>
          {weakCount > 0 && (
            <span className="text-rose-500 font-normal">({weakCount} cần cải thiện)</span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="space-y-1.5 p-2">
          {group.items.map((m, idx) => (
            <TagRow key={`${m.tagId ?? 'x'}-${idx}`} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Group metrics by tagType for a given skill tab */
function useSkillMetrics(allMetrics: LearnerTagMetric[], skill: SkillTab) {
  return useMemo(() => {
    // Filter metrics that belong to this skill tab
    const filtered = allMetrics.filter(m =>
      getSkillsForMetric(m).includes(skill)
    );

    // Group by tagType
    const grouped: Record<string, LearnerTagMetric[]> = {};
    for (const m of filtered) {
      const key = m.tagType || 'OTHER';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    }

    // Sort: QUESTION_TYPE/TASK/PART first, then TOPIC, DIFFICULTY last
    const priority: Record<string, number> = {
      QUESTION_TYPE: 0, WRITING_TYPE: 0, TASK: 0, PART: 0,
      TOPIC: 1, WRITING_TOPIC: 1,
      DIFFICULTY: 2, PASSAGE: 2, SECTION: 2, SKILL: 3,
    };

    return Object.entries(grouped)
      .sort(([a], [b]) => (priority[a] ?? 99) - (priority[b] ?? 99))
      .map(([type, items]) => ({
        type,
        label: getTagTypeLabel(type),
        items: items.sort((a, b) => clamp01(a.masteryLevel) - clamp01(b.masteryLevel)),
      }));
  }, [allMetrics, skill]);
}

/* ─────────────────── Skill Content Panel ─────────────────── */

function SkillMetricsPanel({
  allMetrics,
  skill,
}: {
  allMetrics: LearnerTagMetric[];
  skill: SkillTab;
}) {
  const groups = useSkillMetrics(allMetrics, skill);

  if (groups.length === 0) {
    return (
      <div className="text-sm text-gray-400 rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center">
        Chưa có dữ liệu cho kỹ năng này. Hãy làm thêm bài luyện tập để hệ thống phân tích.
      </div>
    );
  }

  const totalMetrics = groups.reduce((sum, g) => sum + g.items.length, 0);
  const weakMetrics = groups.reduce(
    (sum, g) => sum + g.items.filter(m => clamp01(m.masteryLevel) < 0.5).length,
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{totalMetrics} chỉ số</span>
        {weakMetrics > 0 && (
          <span className="text-rose-500 font-medium">• {weakMetrics} cần cải thiện</span>
        )}
        {totalMetrics > 0 && weakMetrics === 0 && (
          <span className="text-emerald-500 font-medium">• Tất cả đều tốt ✓</span>
        )}
      </div>
      {groups.map((group, idx) => (
        <TagGroupAccordion key={group.type} group={group} defaultOpen={idx === 0} />
      ))}
    </div>
  );
}

/* ─────────────────── Main Component ─────────────────── */

type BandRow = {
  label: string;
  placement: number | null;
  calibrated: number | null;
  target: number | null;
};

export function RoadmapInsights({ weekNumber }: { weekNumber?: number }) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<LearnerRoadmapInsights | null>(null);
  const [activeSkill, setActiveSkill] = useState<SkillTab>('reading');

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await getRoadmapInsights(weekNumber);
      setInsights(data);
    } catch {
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [weekNumber]);

  useEffect(() => {
    const handler = () => fetchInsights();
    window.addEventListener('roadmap-updated', handler);
    return () => {
      window.removeEventListener('roadmap-updated', handler);
    };
  }, []);

  // Merge weakest + strongest into a single deduplicated list
  const allMetrics = useMemo(() => {
    if (!insights) return [];
    const merged = [...(insights.weakestTags ?? []), ...(insights.strongestTags ?? [])];
    // Deduplicate by tagId
    const seen = new Set<number>();
    return merged.filter(m => {
      if (m.tagId == null) return true;
      if (seen.has(m.tagId)) return false;
      seen.add(m.tagId);
      return true;
    });
  }, [insights]);

  const rows: BandRow[] = useMemo(() => {
    if (!insights) return [];
    return [
      {
        label: 'Overall',
        placement: insights.placementOverall ?? null,
        calibrated: insights.calibratedOverall ?? null,
        target: insights.targetOverall ?? null,
      },
      {
        label: 'Reading',
        placement: insights.placementReading ?? null,
        calibrated: insights.calibratedReading ?? null,
        target: insights.targetReading ?? null,
      },
      {
        label: 'Listening',
        placement: insights.placementListening ?? null,
        calibrated: insights.calibratedListening ?? null,
        target: insights.targetListening ?? null,
      },
      {
        label: 'Writing',
        placement: insights.placementWriting ?? null,
        calibrated: insights.calibratedWriting ?? null,
        target: insights.targetWriting ?? null,
      },
      {
        label: 'Speaking',
        placement: insights.placementSpeaking ?? null,
        calibrated: insights.calibratedSpeaking ?? null,
        target: insights.targetSpeaking ?? null,
      },
    ];
  }, [insights]);

  if (loading) return <SkeletonCard className="h-80" />;
  if (!insights) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-gray-500" />
          <div className="text-base font-semibold text-gray-800">Lộ trình cá nhân</div>
        </div>
        <div className="text-sm text-gray-500">
          Không thể tải bảng chỉ số lúc này. Thử tải lại trang hoặc làm mới dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="relative bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(244,63,94,0.12),transparent_35%),radial-gradient(circle_at_40%_90%,rgba(16,185,129,0.10),transparent_40%)] px-6 py-5">
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="h-full w-full bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:22px_22px]" />
        </div>
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white/70 border border-white/60 backdrop-blur">
                <Activity className="h-5 w-5 text-gray-700" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">Lộ trình cá nhân</h2>
                <p className="text-xs text-gray-500">
                  Bảng chỉ số chi tiết: tự đánh giá, hệ thống hiệu chỉnh, và khoảng cách tới mục tiêu.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <div className="text-[11px] text-gray-500">Ngày thi</div>
            <div className="text-sm font-semibold text-gray-800 font-mono">
              {fmtDateYmd(insights.examDate)}
              {insights.daysToExam != null ? ` • D-${insights.daysToExam}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white px-6 py-5 space-y-5">
        {/* Warning */}
        {insights?.targetOverAmbitious && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
            <TriangleAlert className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-amber-800">Mục tiêu có thể hơi quá tầm</div>
              <div className="text-sm text-amber-700 leading-relaxed">
                {insights.targetWarning ||
                  'Hãy cân nhắc giảm mục tiêu, hoặc tăng tần suất luyện tập trước ngày thi.'}
              </div>
              {insights.achievableOverallByExam != null && (
                <div className="text-xs text-amber-700 mt-1">
                  Ước tính bảo thủ: overall có thể đạt tới khoảng <span className="font-mono font-semibold">{fmtBand(insights.achievableOverallByExam)}</span> tới ngày thi.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global indices */}
        <div className="grid gap-3 md:grid-cols-2">
          <MetricBar label="Chỉ số thành thạo" value01={insights.masteryIndex} accent="sky" />
          <MetricBar label="Chỉ số tự tin" value01={insights.confidenceIndex} accent="amber" />
        </div>

        {/* Band table */}
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-800">Bảng điểm band</div>
            <div className="text-[11px] text-gray-500">
              {insights.placementCompletedAt ? `Đầu vào: ${fmtDateYmd(insights.placementCompletedAt)}` : ''}
              {insights.lastMetricUpdatedAt ? ` • Cập nhật: ${fmtDateYmd(insights.lastMetricUpdatedAt)}` : ''}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs text-gray-500 bg-white">
                <tr className="border-t border-gray-100">
                  <th className="text-left font-medium px-4 py-2">Kỹ năng</th>
                  <th className="text-right font-medium px-4 py-2">
                    {insights.placementSelfAssessed ? 'Tự đánh giá' : 'Đầu vào'}
                  </th>
                  <th className="text-right font-medium px-4 py-2">Hiệu chỉnh</th>
                  <th className="text-right font-medium px-4 py-2">Mục tiêu</th>
                  <th className="text-right font-medium px-4 py-2">Chênh lệch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => {
                  const gap =
                    r.target != null && r.target >= 0 && r.calibrated != null && r.calibrated >= 0
                      ? Math.round((r.target - r.calibrated) * 2) / 2
                      : null;
                  const gapClass =
                    gap == null
                      ? 'text-gray-400'
                      : gap <= 0
                        ? 'text-emerald-600'
                        : gap <= 1.0
                          ? 'text-amber-600'
                          : 'text-rose-600';

                  return (
                    <tr key={r.label} className={r.label === 'Overall' ? 'bg-gray-50/40' : 'bg-white'}>
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{r.label}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-600">{fmtBand(r.placement)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-800">{fmtBand(r.calibrated)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-600">{fmtBand(r.target)}</td>
                      <td className={`px-4 py-2.5 text-right font-mono font-semibold ${gapClass}`}>
                        {gap == null ? '—' : `${gap > 0 ? '+' : ''}${gap.toFixed(1)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!!insights?.calibrationNote && (
            <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-start gap-2">
              <Info className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="text-xs text-gray-600 leading-relaxed">{insights.calibrationNote}</div>
            </div>
          )}
        </div>

        {/* ── Skill Tabs ── */}
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100">
            <div className="flex overflow-x-auto">
              {SKILL_TABS.map((tab) => {
                const isActive = activeSkill === tab.key;
                const skillMetrics = allMetrics.filter(m =>
                  getSkillsForMetric(m).includes(tab.key)
                );
                const weakCount = skillMetrics.filter(m => clamp01(m.masteryLevel) < 0.5).length;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSkill(tab.key)}
                    className={`relative px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'text-blue-700 bg-white border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/60'
                    }`}
                  >
                    {tab.label}
                    {weakCount > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600">
                        {weakCount}
                      </span>
                    )}
                    {weakCount === 0 && skillMetrics.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4">
            <SkillMetricsPanel allMetrics={allMetrics} skill={activeSkill} />
          </div>
        </div>
      </div>
    </div>
  );
}
