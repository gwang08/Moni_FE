'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, Eye, Video, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getMySessions, getSessionEvaluation, cancelScoringSession } from '@/lib/expert-api';
import type { ScoringSession, ExpertEvaluation } from '@/types/expert.types';
import { toast } from 'sonner';

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

const SCORE_LABELS: Record<string, string> = {
  fluency: 'Fluency',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  pronunciation: 'Pronunciation',
  taskResponse: 'Task Response',
  coherence: 'Coherence',
  lexicalResource: 'Lexical Resource',
  grammaticalRange: 'Grammatical Range',
};

function EvaluationDialog({
  open,
  onClose,
  evaluation,
}: {
  open: boolean;
  onClose: () => void;
  evaluation: ExpertEvaluation | null;
}) {
  if (!evaluation) return null;

  const scoreKeys = Object.keys(SCORE_LABELS) as (keyof ExpertEvaluation)[];
  const bandScores = scoreKeys.filter(
    (k) => evaluation[k] !== undefined && evaluation[k] !== null
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kết quả đánh giá</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Expert & date */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {evaluation.expertName && <span>Giảng viên: <strong className="text-foreground">{evaluation.expertName}</strong></span>}
            <span>{new Date(evaluation.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>

          {/* Overall score */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-primary/5 border py-5">
            <span className="text-4xl font-bold text-primary">{evaluation.overallScore}</span>
            <span className="text-sm text-muted-foreground mt-1">Band Score tổng thể</span>
          </div>

          {/* Band scores grid */}
          {bandScores.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Chi tiết điểm</p>
              <div className="grid grid-cols-2 gap-2">
                {bandScores.map((k) => (
                  <div key={k} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{SCORE_LABELS[k as string]}</span>
                    <span className="font-semibold">{evaluation[k] as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {evaluation.feedback && (
            <div>
              <p className="text-sm font-medium mb-1">Nhận xét</p>
              <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">{evaluation.feedback}</p>
            </div>
          )}

          {/* Strengths */}
          {evaluation.strengths && (
            <div>
              <p className="text-sm font-medium mb-1 text-green-700">Điểm mạnh</p>
              <p className="text-sm text-muted-foreground bg-green-50 rounded-lg px-3 py-2">{evaluation.strengths}</p>
            </div>
          )}

          {/* Areas for improvement */}
          {evaluation.areasForImprovement && (
            <div>
              <p className="text-sm font-medium mb-1 text-amber-700">Cần cải thiện</p>
              <p className="text-sm text-muted-foreground bg-amber-50 rounded-lg px-3 py-2">{evaluation.areasForImprovement}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Check if session room is expired (created > 30 min ago and still IN_PROGRESS) */
function isSessionExpired(session: ScoringSession): boolean {
  if (session.status !== 'IN_PROGRESS') return false;
  if (!session.createdAt) return false;
  const created = new Date(session.createdAt.includes('Z') ? session.createdAt : session.createdAt + 'Z');
  const minutesAgo = (Date.now() - created.getTime()) / 60000;
  return minutesAgo > 35; // 30 min room + 5 min buffer
}

export default function ScoringHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ScoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<ExpertEvaluation | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);

  useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch(() => toast.error('Không thể tải lịch sử chấm điểm'))
      .finally(() => setLoading(false));
  }, []);

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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Lịch sử chấm điểm với Giảng viên</h1>
          <p className="text-sm text-muted-foreground">Các phiên chấm điểm của bạn</p>
        </div>
      </div>

      {/* Table */}
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phiên</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kỹ năng</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Giảng viên</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ngày</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{session.id}</td>
                  <td className="px-4 py-3 font-medium">{session.skill}</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.expertDisplayName || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${STATUS_VARIANT[session.status]} border-0 text-xs`}>
                      {STATUS_LABEL[session.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {session.createdAt
                      ? new Date(session.createdAt).toLocaleDateString('vi-VN')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {session.status === 'COMPLETED' && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                            onClick={() => handleViewEvaluation(session.id)}>
                            <Eye className="h-3.5 w-3.5" /> Xem đánh giá
                          </Button>
                          {session.recordingUrl && (
                            <audio
                              controls
                              src={session.recordingUrl}
                              title="Nghe lại phiên"
                              className="h-7 max-w-[180px]"
                            />
                          )}
                        </>
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
                              setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: 'CANCELLED' } : s));
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

      {/* Evaluation dialog */}
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
    </div>
  );
}
