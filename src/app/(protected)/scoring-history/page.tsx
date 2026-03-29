'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, Eye, Video, XCircle, PenLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { getMySessions, getSessionEvaluation, cancelScoringSession, getExperts, createScoringSession } from '@/lib/expert-api';
import { getServices } from '@/lib/payment-api';
import type { ExpertProfile } from '@/types/expert.types';
import { SpeakingModeExpertGrid } from '@/components/speaking/speaking-mode-expert-grid';
import { SpeakingModeExpertInlineConfirm } from '@/components/speaking/speaking-mode-expert-inline-confirm';
import { useAuthStore } from '@/store/auth-store';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft } from 'lucide-react';
import type { ScoringSession, ExpertEvaluation } from '@/types/expert.types';
import { toast } from 'sonner';
import { EvaluationDialog } from './evaluation-dialog';
import { ScoringHistoryFilters, type FilterState } from './scoring-history-filters';
import { WritingSubmissionsSection } from './writing-submissions-section';
import { getWritingSubmissions, getWritingSubmissionDetail, type WritingSubmission } from '@/lib/ai-api';

type SessionStatus = ScoringSession['status'];

const STATUS_LABEL: Record<SessionStatus, string> = {
  QUEUED: 'Đang chờ',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};

const STATUS_VARIANT: Record<SessionStatus, string> = {
  QUEUED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function isSessionExpired(session: ScoringSession): boolean {
  if (session.status !== 'IN_PROGRESS') return false;
  if (!session.createdAt) return false;
  const created = new Date(session.createdAt.includes('Z') || session.createdAt.includes('+') ? session.createdAt : session.createdAt + 'Z');
  return (Date.now() - created.getTime()) / 60000 > 35;
}

export default function ScoringHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ScoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<ExpertEvaluation | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ status: 'ALL', skill: 'ALL', sort: 'newest' });
  const [writingSubmissions, setWritingSubmissions] = useState<WritingSubmission[]>([]);
  const [loadingWriting, setLoadingWriting] = useState(true);
  const [aiCost, setAiCost] = useState(0);
  const [expertCost, setExpertCost] = useState(0);
  // Expert selection modal
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [expertSubmissionId, setExpertSubmissionId] = useState<number | null>(null);
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [expertSearch, setExpertSearch] = useState('');
  const [confirming, setConfirming] = useState<ExpertProfile | null>(null);
  const [submittingExpert, setSubmittingExpert] = useState(false);
  const { user, refreshProfile } = useAuthStore();

  useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch(() => toast.error('Không thể tải lịch sử chấm điểm'))
      .finally(() => setLoading(false));

    getWritingSubmissions()
      .then(setWritingSubmissions)
      .catch(() => toast.error('Không thể tải danh sách bài viết'))
      .finally(() => setLoadingWriting(false));

    getServices()
      .then((services) => {
        setAiCost(services.find((s) => s.serviceCode === 'AI_WRITING_SCORE')?.creditCost ?? 0);
        setExpertCost(services.find((s) => s.serviceCode === 'EXPERT_WRITING_SCORE')?.creditCost ?? 0);
      })
      .catch(() => {});
  }, []);

  const refreshWritingSubmissions = () => {
    setLoadingWriting(true);
    getWritingSubmissions()
      .then(setWritingSubmissions)
      .catch(() => toast.error('Không thể tải danh sách bài viết'))
      .finally(() => setLoadingWriting(false));
  };

  const filtered = sessions
    .filter(s => filters.status === 'ALL' || s.status === filters.status)
    .filter(s => filters.skill === 'ALL' || s.skill === filters.skill)
    .sort((a, b) => {
      const ta = new Date(a.createdAt ?? '').getTime() || 0;
      const tb = new Date(b.createdAt ?? '').getTime() || 0;
      return filters.sort === 'newest' ? tb - ta : ta - tb;
    });

  const handleViewEvaluation = async (sessionId: number) => {
    setLoadingEval(true);
    setDialogOpen(true);
    try {
      const data = await getSessionEvaluation(sessionId);
      setEvaluation(data);
    } catch {
      toast.error('Không thể tải kết quả đánh giá');
      setDialogOpen(false);
    } finally {
      setLoadingEval(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Writing Submissions Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <PenLine className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Bài viết đã nộp</h2>
            <p className="text-sm text-muted-foreground">Danh sách bài writing của bạn</p>
          </div>
        </div>
        <WritingSubmissionsSection
          submissions={writingSubmissions}
          loading={loadingWriting}
          aiCost={aiCost}
          onRefresh={refreshWritingSubmissions}
          onViewResult={(submissionId) => {
            router.push(`/writing/result/${submissionId}`);
          }}
          onExpertScore={(submissionId) => {
            setExpertSubmissionId(submissionId);
            setExpertModalOpen(true);
            if (experts.length === 0) {
              setLoadingExperts(true);
              getExperts()
                .then(setExperts)
                .catch(() => toast.error('Không thể tải danh sách giảng viên'))
                .finally(() => setLoadingExperts(false));
            }
          }}
        />
      </section>

      {/* Expert Sessions Section */}
      <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Lịch sử chấm điểm với Giảng viên</h1>
          <p className="text-sm text-muted-foreground">Các phiên chấm điểm của bạn</p>
        </div>
      </div>

      {!loading && sessions.length > 0 && (
        <ScoringHistoryFilters filters={filters} onChange={setFilters} />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Bạn chưa có phiên chấm điểm nào.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Phiên', 'Kỹ năng', 'Giảng viên', 'Trạng thái', 'Thời gian', 'Bản ghi', 'Hành động'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">Không có phiên nào phù hợp</td>
                </tr>
              ) : filtered.map((session) => (
                <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{session.id}</td>
                  <td className="px-4 py-3 font-medium">{session.skill}</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.expertDisplayName || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${STATUS_VARIANT[session.status]} border-0 text-xs`}>
                      {STATUS_LABEL[session.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {session.createdAt
                      ? new Date(session.createdAt.includes('Z') || session.createdAt.includes('+') ? session.createdAt : session.createdAt + 'Z')
                          .toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {session.recordingUrl && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground w-10 shrink-0">Bạn:</span>
                          <audio controls src={session.recordingUrl} className="h-7 w-36" />
                        </div>
                      )}
                      {session.expertRecordingUrl && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground w-10 shrink-0">GV:</span>
                          <audio controls src={session.expertRecordingUrl} className="h-7 w-36" />
                        </div>
                      )}
                      {!session.recordingUrl && !session.expertRecordingUrl && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {session.status === 'COMPLETED' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                          onClick={() => handleViewEvaluation(session.id)}>
                          <Eye className="h-3.5 w-3.5" /> Xem đánh giá
                        </Button>
                      )}
                      {session.status === 'IN_PROGRESS' && !isSessionExpired(session) && (
                        <Button size="sm" className="h-7 text-xs gap-1"
                          onClick={() => router.push(`/expert-scoring/call/${session.id}`)}>
                          <Video className="h-3.5 w-3.5" /> Tham gia lại
                        </Button>
                      )}
                      {session.status === 'IN_PROGRESS' && isSessionExpired(session) && (
                        <Badge className="bg-red-100 text-red-700 border-0 text-xs">Đã hết hạn</Badge>
                      )}
                      {session.status === 'QUEUED' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500 hover:text-red-600"
                          onClick={async () => {
                            try {
                              await cancelScoringSession(session.id);
                              setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: 'CANCELLED' } : s));
                              toast.success('Đã huỷ phiên');
                            } catch { toast.error('Không thể huỷ phiên'); }
                          }}>
                          <XCircle className="h-3.5 w-3.5" /> Huỷ
                        </Button>
                      )}
                      {session.status === 'CANCELLED' && (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loadingEval ? (
        <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
          <DialogContent className="max-w-lg">
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <EvaluationDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEvaluation(null); }}
          evaluation={evaluation}
        />
      )}
      </section>

      {/* Expert selection modal for writing */}
      <Dialog open={expertModalOpen} onOpenChange={(v) => { if (!v) { setExpertModalOpen(false); setConfirming(null); } }}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-bold">Chọn giảng viên chấm Writing</h3>
          </div>
          {confirming && (
            <SpeakingModeExpertInlineConfirm
              expert={confirming}
              cost={expertCost}
              balance={user?.credit ?? 0}
              submitting={submittingExpert}
              onConfirm={async () => {
                if (!expertSubmissionId) return;
                setSubmittingExpert(true);
                try {
                  // Fetch full essay content before sending to expert
                  const sub = await getWritingSubmissionDetail(expertSubmissionId);
                  await createScoringSession({
                    expertId: confirming.id,
                    skill: 'WRITING',
                    content: sub.essayContent,
                    testId: sub.testId ?? undefined,
                    writingSubmissionId: sub.submissionId,
                  });
                  await refreshProfile();
                  toast.success('Đã gửi bài cho giảng viên!');
                  setExpertModalOpen(false);
                  setConfirming(null);
                  refreshWritingSubmissions();
                } catch {
                  toast.error('Không thể tạo phiên chấm');
                } finally {
                  setSubmittingExpert(false);
                }
              }}
              onCancel={() => setConfirming(null)}
            />
          )}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={expertSearch} onChange={(e) => setExpertSearch(e.target.value)} placeholder="Tìm theo tên..." className="pl-9" />
          </div>
          {loadingExperts ? (
            <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : (
            <SpeakingModeExpertGrid
              experts={experts.filter((e) => !expertSearch.trim() || e.displayName.toLowerCase().includes(expertSearch.toLowerCase()))}
              expertCost={expertCost}
              onBook={(e) => setConfirming(e)}
              onDetail={(e) => router.push(`/experts/${e.id}`)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
