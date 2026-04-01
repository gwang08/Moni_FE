'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Headphones, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getScoringSessionById, getScoringSessionEvaluation } from '@/lib/admin-api';
import type { ExpertEvaluation, ScoringSession } from '@/types/expert.types';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ id: string }>;
}

type SkillCriteria = { key: keyof ExpertEvaluation; label: string }[];

const STATUS_LABEL: Record<ScoringSession['status'], string> = {
  QUEUED: 'Chờ xử lý',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};

const STATUS_CLASS: Record<ScoringSession['status'], string> = {
  QUEUED: 'bg-yellow-100 text-yellow-800 border-0',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-0',
  COMPLETED: 'bg-green-100 text-green-800 border-0',
  CANCELLED: 'bg-gray-100 text-gray-500 border-0',
};

const SPEAKING_CRITERIA: SkillCriteria = [
  { key: 'fluency', label: 'Fluency' },
  { key: 'vocabulary', label: 'Vocabulary' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'pronunciation', label: 'Pronunciation' },
];

const WRITING_CRITERIA: SkillCriteria = [
  { key: 'taskResponse', label: 'Task Response' },
  { key: 'coherence', label: 'Coherence' },
  { key: 'lexicalResource', label: 'Lexical Resource' },
  { key: 'grammaticalRange', label: 'Grammatical Range' },
];

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const normalized = value.includes('Z') || value.includes('+') ? value : `${value}Z`;
  return new Date(normalized).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSessionMoment(session: ScoringSession): string {
  return session.endedAt || session.submittedAt || session.createdAt || '';
}

function scoreText(score?: number | null): string {
  return typeof score === 'number' ? score.toFixed(1) : '-';
}

function RecordingBlock({ label, src }: { label: string; src?: string }) {
  if (!src) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
      <span className="w-24 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <audio controls src={src} className="h-8 w-full" />
    </div>
  );
}

export default function AdminScoringSessionDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const sessionId = Number(id);

  const [session, setSession] = useState<ScoringSession | null>(null);
  const [evaluation, setEvaluation] = useState<ExpertEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);

  useEffect(() => {
    if (Number.isNaN(sessionId)) {
      toast.error('ID phiên không hợp lệ');
      router.push('/admin/scoring-sessions');
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        const detail = await getScoringSessionById(sessionId);
        if (!mounted) return;
        setSession(detail);

        if (detail.status === 'COMPLETED') {
          setLoadingEvaluation(true);
          try {
            const evalData = await getScoringSessionEvaluation(sessionId);
            if (mounted) setEvaluation(evalData);
          } catch {
            if (mounted) setEvaluation(null);
          } finally {
            if (mounted) setLoadingEvaluation(false);
          }
        }
      } catch {
        toast.error('Không thể tải chi tiết phiên chấm');
        router.push('/admin/scoring-sessions');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [router, sessionId]);

  const criteria = useMemo(
    () => (session?.skill === 'WRITING' ? WRITING_CRITERIA : SPEAKING_CRITERIA),
    [session?.skill],
  );

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  const submittedMoment = session.submittedAt || session.endedAt || session.createdAt;
  const currentMoment = getSessionMoment(session);

  return (
    <div className="h-[calc(100vh-56px)] overflow-hidden bg-gray-50">
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/scoring-sessions')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold">Chi tiết bài chấm #{session.id}</h1>
                <Badge className={STATUS_CLASS[session.status]}>{STATUS_LABEL[session.status]}</Badge>
                <Badge variant="outline">{session.skill}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {session.userDisplayName || 'Chưa có thí sinh'} · {session.expertDisplayName || 'Chưa có giám khảo'} ·{' '}
                {formatDateTime(currentMoment)}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>ID phiên</p>
              <p className="font-mono text-sm text-foreground">#{session.id}</p>
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-6 lg:grid-cols-2">
          <Card className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Chi tiết bài làm</h2>
                  <p className="text-xs text-muted-foreground">
                    Thí sinh: {session.userDisplayName || '-'} · Nộp lúc: {formatDateTime(submittedMoment)}
                  </p>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Kỹ năng</p>
                  <p className="mt-1 font-medium">{session.skill}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Giám khảo</p>
                  <p className="mt-1 font-medium">{session.expertDisplayName || '-'}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Thời gian</p>
                  <p className="mt-1 font-medium">{formatDateTime(submittedMoment)}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                  <p className="mt-1 font-medium">{STATUS_LABEL[session.status]}</p>
                </div>
              </div>

              {session.content ? (
                <div className="rounded-xl border bg-white p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nội dung bài làm</p>
                  <div className="whitespace-pre-wrap text-sm leading-6 text-gray-800">
                    {session.content.replace(/<[^>]*>/g, '')}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-white p-6 text-sm text-muted-foreground">
                  Chưa có nội dung bài làm trong phiên này.
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bản ghi</p>
                <RecordingBlock label="Người học" src={session.recordingUrl} />
                <RecordingBlock label="Giám khảo" src={session.expertRecordingUrl} />
                {!session.recordingUrl && !session.expertRecordingUrl && (
                  <div className="rounded-xl border border-dashed bg-white p-4 text-sm text-muted-foreground">
                    Chưa có bản ghi.
                  </div>
                )}
              </div>

              {session.roomUrl && (
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Phòng chấm</p>
                  <a href={session.roomUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-blue-600 hover:underline">
                    {session.roomUrl}
                  </a>
                </div>
              )}
            </div>
          </Card>

          <Card className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Headphones className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Phần chấm điểm</h2>
                  <p className="text-xs text-muted-foreground">
                    {loadingEvaluation ? 'Đang tải kết quả...' : evaluation ? 'Kết quả đã lưu' : 'Chưa có kết quả chấm'}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {evaluation ? (
                <>
                  <div className="flex items-center gap-3 rounded-2xl border bg-white p-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <div className="text-center">
                        <p className="text-xl font-bold text-primary">{scoreText(evaluation.overallScore)}</p>
                        <p className="text-[10px] text-muted-foreground">Overall</p>
                      </div>
                    </div>
                    <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                      {criteria.map((criterion) => {
                        const score = evaluation[criterion.key];
                        return (
                          <div key={criterion.key} className="rounded-xl border bg-muted/20 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{criterion.label}</p>
                            <p className="mt-1 text-lg font-bold">{scoreText(score as number | null | undefined)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nhận xét</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {evaluation.feedback || '-'}
                      </p>
                    </div>
                    {evaluation.strengths && (
                      <div className="rounded-xl border bg-emerald-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Điểm mạnh</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {evaluation.strengths}
                        </p>
                      </div>
                    )}
                    {evaluation.areasForImprovement && (
                      <div className="rounded-xl border bg-amber-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Cần cải thiện</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {evaluation.areasForImprovement}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thông tin thêm</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-muted/20 p-3">
                        <p className="text-[11px] text-muted-foreground">Giám khảo</p>
                        <p className="mt-1 font-medium">{evaluation.expertName || session.expertDisplayName || '-'}</p>
                      </div>
                      <div className="rounded-lg bg-muted/20 p-3">
                        <p className="text-[11px] text-muted-foreground">Thời gian đánh giá</p>
                        <p className="mt-1 font-medium">{formatDateTime(evaluation.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed bg-white p-6 text-sm text-muted-foreground">
                  Phiên này chưa có phần chấm điểm.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
