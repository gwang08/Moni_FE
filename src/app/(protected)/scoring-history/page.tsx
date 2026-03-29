'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenLine, GraduationCap, Loader2, Search, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import { getMySessions, getSessionEvaluation, getExperts, createScoringSession } from '@/lib/expert-api';
import { getWritingSubmissions, getWritingSubmissionDetail, type WritingSubmission } from '@/lib/ai-api';
import { SpeakingModeExpertGrid } from '@/components/speaking/speaking-mode-expert-grid';
import { SpeakingModeExpertInlineConfirm } from '@/components/speaking/speaking-mode-expert-inline-confirm';
import { useAuthStore } from '@/store/auth-store';
import { EvaluationDialog } from './evaluation-dialog';
import type { ScoringSession, ExpertProfile, ExpertEvaluation } from '@/types/expert.types';
import { toast } from 'sonner';

type Tab = 'writing' | 'expert';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chưa chấm', cls: 'bg-orange-100 text-orange-700' },
  SUBMITTED: { label: 'Chưa chấm', cls: 'bg-orange-100 text-orange-700' },
  PROCESSING: { label: 'Đang chấm', cls: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Đã chấm', cls: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Lỗi', cls: 'bg-red-100 text-red-700' },
  QUEUED: { label: 'Đang chờ', cls: 'bg-yellow-100 text-yellow-700' },
  IN_PROGRESS: { label: 'Đang diễn ra', cls: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Đã huỷ', cls: 'bg-gray-100 text-gray-500' },
};

function fmtDate(d: string) {
  return new Date(d.includes('Z') || d.includes('+') ? d : d + 'Z')
    .toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ScoringHistoryPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuthStore();
  const [tab, setTab] = useState<Tab>('writing');

  // Data
  const [subs, setSubs] = useState<WritingSubmission[]>([]);
  const [sessions, setSessions] = useState<ScoringSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Expert modal
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [expertSubId, setExpertSubId] = useState<number | null>(null);
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [expertSearch, setExpertSearch] = useState('');
  const [confirming, setConfirming] = useState<ExpertProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Evaluation dialog
  const [evalOpen, setEvalOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<ExpertEvaluation | null>(null);

  useEffect(() => {
    Promise.all([
      getWritingSubmissions().then(setSubs).catch(() => {}),
      getMySessions().then(setSessions).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      getWritingSubmissions().then(setSubs).catch(() => {}),
      getMySessions().then(setSessions).catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  const handleExpertScore = (subId: number) => {
    setExpertSubId(subId);
    setExpertModalOpen(true);
    if (experts.length === 0) {
      setLoadingExperts(true);
      getExperts().then(setExperts).catch(() => {}).finally(() => setLoadingExperts(false));
    }
  };

  const handleBookExpert = async (expert: ExpertProfile) => {
    if (!expertSubId) return;
    setSubmitting(true);
    try {
      const sub = await getWritingSubmissionDetail(expertSubId);
      await createScoringSession({
        expertId: expert.id, skill: 'WRITING', content: sub.essayContent,
        testId: sub.testId ?? undefined, writingSubmissionId: sub.submissionId,
      });
      await refreshProfile();
      toast.success('Đã gửi bài cho giảng viên!');
      setExpertModalOpen(false);
      setConfirming(null);
      refresh();
    } catch { toast.error('Không thể tạo phiên chấm'); }
    finally { setSubmitting(false); }
  };

  const handleViewEval = async (sessionId: number) => {
    setEvalOpen(true);
    try {
      const data = await getSessionEvaluation(sessionId);
      setEvaluation(data);
    } catch { toast.error('Không thể tải kết quả'); setEvalOpen(false); }
  };

  return (
    <>
      <ChibiAnimationStyles />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header chibi */}
        <div className="text-center mb-6">
          <ChibiMascot mood="happy" size={64} />
          <h1 className="text-xl font-bold text-gray-800 mt-2">Lịch sử chấm điểm</h1>
          <p className="text-sm text-gray-400">Theo dõi bài viết và phiên chấm của bạn</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 justify-center">
          <button onClick={() => setTab('writing')} className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === 'writing' ? 'bg-teal-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <PenLine className="h-3.5 w-3.5" /> Bài viết ({subs.length})
          </button>
          <button onClick={() => setTab('expert')} className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === 'expert' ? 'bg-orange-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <GraduationCap className="h-3.5 w-3.5" /> Phiên chấm ({sessions.length})
          </button>
          <button onClick={refresh} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors" title="Làm mới">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : tab === 'writing' ? (
          /* Writing submissions */
          subs.length === 0 ? (
            <div className="text-center py-12">
              <PenLine className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">Bạn chưa nộp bài viết nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subs.map((s) => {
                const st = STATUS_BADGE[s.evaluationStatus] ?? STATUS_BADGE.PENDING;
                const canScore = s.evaluationStatus === 'PENDING' || s.evaluationStatus === 'SUBMITTED';
                return (
                  <div key={s.submissionId} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3 flex-wrap min-w-0">
                      <Badge variant="outline" className="text-xs font-semibold shrink-0">{s.taskType === 'TASK_1' ? 'Task 1' : 'Task 2'}</Badge>
                      <span className="text-sm text-gray-600">{s.wordCount ?? 0} từ</span>
                      <span className="text-xs text-gray-400">{fmtDate(s.submittedAt)}</span>
                      <Badge className={`text-xs border-0 ${st.cls}`}>{st.label}</Badge>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {canScore && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push(`/writing/result/${s.submissionId}`)}>Chấm AI</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleExpertScore(s.submissionId)}>Gửi Expert</Button>
                        </>
                      )}
                      {s.evaluationStatus === 'COMPLETED' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push(`/writing/result/${s.submissionId}`)}>Xem kết quả</Button>
                      )}
                      {s.evaluationStatus === 'PROCESSING' && (
                        <Badge className="text-xs bg-blue-50 text-blue-600 border-0">Đang chờ...</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Expert sessions */
          sessions.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">Bạn chưa có phiên chấm nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => {
                const st = STATUS_BADGE[s.status] ?? STATUS_BADGE.QUEUED;
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3 flex-wrap min-w-0">
                      <span className="text-sm font-medium text-gray-700">#{s.id}</span>
                      <Badge variant="outline" className="text-xs">{s.skill}</Badge>
                      <span className="text-xs text-gray-500">{s.expertDisplayName}</span>
                      <Badge className={`text-xs border-0 ${st.cls}`}>{st.label}</Badge>
                      {s.createdAt && <span className="text-xs text-gray-400">{fmtDate(String(s.createdAt))}</span>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {s.status === 'COMPLETED' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleViewEval(s.id)}>Xem đánh giá</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Expert selection modal */}
        <Dialog open={expertModalOpen} onOpenChange={(v) => { if (!v) { setExpertModalOpen(false); setConfirming(null); } }}>
          <DialogContent className="sm:max-w-2xl">
            <h3 className="text-lg font-bold mb-3">Chọn giảng viên chấm Writing</h3>
            {confirming && (
              <SpeakingModeExpertInlineConfirm expert={confirming} cost={0} balance={user?.credit ?? 0} submitting={submitting}
                onConfirm={() => handleBookExpert(confirming)} onCancel={() => setConfirming(null)} />
            )}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={expertSearch} onChange={(e) => setExpertSearch(e.target.value)} placeholder="Tìm theo tên..." className="pl-9" />
            </div>
            {loadingExperts ? (
              <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : (
              <SpeakingModeExpertGrid
                experts={experts.filter(e => !expertSearch.trim() || e.displayName.toLowerCase().includes(expertSearch.toLowerCase()))}
                expertCost={0} onBook={setConfirming} onDetail={(e) => router.push(`/experts/${e.id}`)} />
            )}
          </DialogContent>
        </Dialog>

        {/* Evaluation dialog */}
        <EvaluationDialog open={evalOpen} onClose={() => { setEvalOpen(false); setEvaluation(null); }} evaluation={evaluation} />
      </div>
    </>
  );
}
