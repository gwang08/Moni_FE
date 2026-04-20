'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Search, RefreshCw, Shuffle, Sun, Moon } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getExperts, createScoringSession } from '@/lib/expert-api';
import { getWritingSubmissionDetail } from '@/lib/ai-api';
import { getServices } from '@/lib/payment-api';
import { SpeakingModeExpertGrid } from '@/components/speaking/speaking-mode-expert-grid';
import { SpeakingModeExpertInlineConfirm } from '@/components/speaking/speaking-mode-expert-inline-confirm';
import { useAuthStore } from '@/store/auth-store';
import type { ExpertProfile } from '@/types/expert.types';
import { toast } from 'sonner';
import { useUnifiedHistory } from '@/components/scoring-history/use-unified-history';
import { HistoryStats } from '@/components/scoring-history/history-stats';
import {
  HistoryFilterBar,
  type SkillFilter,
  type StatusFilter,
} from '@/components/scoring-history/history-filter-bar';
import { HistoryTable } from '@/components/scoring-history/history-table';

/** Giờ làm việc 8h-22h theo giờ VN — đồng bộ với writing-expert-selection-dialog. */
function isWithinWorkingHours(): boolean {
  const h = new Date().getHours();
  return h >= 8 && h < 22;
}

export default function ScoringHistoryPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuthStore();
  const { entries, loading, refresh } = useUnifiedHistory();

  // Filters
  const [skill, setSkill] = useState<SkillFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  // Expert modal
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [expertSubId, setExpertSubId] = useState<number | null>(null);
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [expertSearch, setExpertSearch] = useState('');
  const [confirming, setConfirming] = useState<ExpertProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expertCost, setExpertCost] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (skill !== 'all' && e.kind !== skill) return false;
      if (status !== 'all' && e.status !== status) return false;
      if (q && !e.title.toLowerCase().includes(q) && !(e.subtitle ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, skill, status, search]);

  const handleExpertScore = (subId: number) => {
    setExpertSubId(subId);
    setExpertModalOpen(true);
    if (experts.length === 0) {
      setLoadingExperts(true);
      Promise.all([
        getExperts().then(setExperts).catch(() => {}),
        getServices()
          .then((services) => {
            setExpertCost(services.find((s) => s.serviceCode === 'EXPERT_WRITING_SCORE')?.creditCost ?? null);
          })
          .catch(() => {}),
      ]).finally(() => setLoadingExperts(false));
    }
  };

  const handleBookExpert = async (expert: ExpertProfile | null) => {
    if (!expertSubId) return;
    setSubmitting(true);
    try {
      const sub = await getWritingSubmissionDetail(expertSubId);
      await createScoringSession({
        expertId: expert?.id ?? null,
        skill: 'WRITING',
        content: sub.essayContent,
        testId: sub.testId ?? undefined,
        writingSubmissionId: sub.submissionId,
      });
      await refreshProfile();
      toast.success(expert ? 'Đã gửi bài cho giảng viên!' : 'Đã gửi ngẫu nhiên cho 1 giảng viên!');
      setExpertModalOpen(false);
      setConfirming(null);
      refresh();
    } catch {
      toast.error(expert ? 'Không thể tạo phiên chấm' : 'Không có giảng viên nào khả dụng, thử chọn thủ công');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Hero row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-[26px] md:text-[30px] font-black tracking-tight">Lịch sử chấm điểm</h1>
            <p className="text-[13.5px] text-slate-500 font-medium mt-1">
              Toàn bộ bài làm Writing, Reading, Listening, Speaking của bạn ở một nơi.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[13px] font-bold text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button
              onClick={() => router.push('/practice')}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-[13px] font-bold inline-flex items-center gap-2 hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              Luyện tập mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <HistoryStats entries={entries} />

        {/* Filter bar */}
        <HistoryFilterBar
          entries={entries}
          skill={skill}
          onSkillChange={setSkill}
          status={status}
          onStatusChange={setStatus}
          search={search}
          onSearchChange={setSearch}
        />

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasEntries={entries.length > 0} />
        ) : (
          <HistoryTable entries={filtered} onExpertScore={handleExpertScore} />
        )}

        {/* Expert modal */}
        <Dialog
          open={expertModalOpen}
          onOpenChange={(v) => {
            if (!v) {
              setExpertModalOpen(false);
              setConfirming(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <h3 className="text-lg font-bold mb-2">Chọn giảng viên chấm Writing</h3>

            {/* Working hours banner */}
            {isWithinWorkingHours() ? (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <Sun className="h-4 w-4 shrink-0" />
                <span>Đang trong giờ làm việc (8h–22h) — thường có kết quả trong vài giờ.</span>
              </div>
            ) : (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Moon className="h-4 w-4 shrink-0" />
                <span>Ngoài giờ làm việc (8h–22h) — có thể nhận kết quả vào sáng mai.</span>
              </div>
            )}

            {/* Random booking — 1-click lazy option */}
            {!confirming && (
              <Button
                onClick={() => handleBookExpert(null)}
                disabled={submitting}
                className="w-full mb-3 gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
              >
                <Shuffle className="h-4 w-4" />
                {submitting ? 'Đang gửi...' : 'Gửi ngẫu nhiên cho giảng viên online'}
              </Button>
            )}

            {confirming && (
              <SpeakingModeExpertInlineConfirm
                expert={confirming}
                cost={expertCost ?? 0}
                balance={user?.credit ?? 0}
                submitting={submitting}
                onConfirm={() => handleBookExpert(confirming)}
                onCancel={() => setConfirming(null)}
              />
            )}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={expertSearch}
                onChange={(e) => setExpertSearch(e.target.value)}
                placeholder="Tìm theo tên..."
                className="pl-9"
              />
            </div>
            {loadingExperts ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <SpeakingModeExpertGrid
                experts={experts.filter(
                  (e) => !expertSearch.trim() || e.displayName.toLowerCase().includes(expertSearch.toLowerCase()),
                )}
                expertCost={expertCost}
                onBook={setConfirming}
                onDetail={(e) => router.push(`/experts/${e.id}`)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function EmptyState({ hasEntries }: { hasEntries: boolean }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-16 text-center">
      <p className="text-[15px] font-bold text-slate-700">
        {hasEntries ? 'Không có bài nào khớp bộ lọc' : 'Bạn chưa có bài làm nào'}
      </p>
      <p className="text-[13px] text-slate-500 mt-1">
        {hasEntries ? 'Thử đổi filter hoặc clear search.' : 'Bắt đầu luyện tập để tạo lịch sử đầu tiên.'}
      </p>
    </div>
  );
}
