'use client';

import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, Camera, ImagePlus, X, Save, Star, MessageSquare, User, Briefcase, Award, Clock, BarChart3, TimerReset } from 'lucide-react';
import { getAdminExperts, updateExpert } from '@/lib/admin-expert-api';
import { uploadMedia } from '@/lib/admin-api';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ExpertProfile, UpdateExpertRequest, ScoringSession } from '@/types/expert.types';
import type { ApiResponse } from '@/types/auth.types';

function formatSessionDate(value?: string | null): string {
  if (!value) return '-';
  const s = value.includes('Z') || value.includes('+') ? value : `${value}Z`;
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const BAND_FIELDS = [
  { key: 'bandReading', label: 'Reading' },
  { key: 'bandListening', label: 'Listening' },
  { key: 'bandWriting', label: 'Writing' },
  { key: 'bandSpeaking', label: 'Speaking' },
] as const;

function calcOverall(r: number, l: number, w: number, s: number): number {
  const avg = (r + l + w + s) / 4;
  return Math.round(avg * 2) / 2;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminExpertDetailPage({ params }: PageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedParams = use(params);
  const expertId = parseInt(resolvedParams.id, 10);

  const [form, setForm] = useState<UpdateExpertRequest>({});
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [certPreviews, setCertPreviews] = useState<string[]>([]);
  const [existingCerts, setExistingCerts] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: experts = [], isLoading } = useQuery({
    queryKey: ['admin-experts'],
    queryFn: getAdminExperts,
  });

  const expert = experts.find(e => e.id === expertId);

  const { data: expertSessions = [] } = useQuery({
    queryKey: ['admin-expert-sessions', expertId],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ScoringSession[]>>('/api/v1/scoring-sessions/admin/all', true);
      return (res.result ?? []).filter((s) => s.expertId === expertId);
    },
    enabled: !!expertId,
  });

  const sessionsWithReview = expertSessions.filter((s) => s.userRating != null || (s.userComment && s.userComment.trim()));

  useEffect(() => {
    if (expert) {
      setForm({
        displayName: expert.displayName || '',
        avatarUrl: expert.avatarUrl || '',
        bandReading: expert.bandReading ?? 7,
        bandListening: expert.bandListening ?? 7,
        bandWriting: expert.bandWriting ?? 7,
        bandSpeaking: expert.bandSpeaking ?? 7,
        yearsExperience: expert.yearsExperience ?? 0,
        bio: expert.bio || '',
      });
      setExistingCerts(expert.certificates ?? []);
    }
  }, [expert]);

  const stats = useMemo(() => {
    let completedSessions = 0;
    let speakingSessions = 0;
    let writingSessions = 0;
    let totalDurationMs = 0;
    let durationCount = 0;

    expertSessions.forEach(session => {
      if (session.status === 'COMPLETED') {
        completedSessions++;
        if (session.skill === 'SPEAKING') speakingSessions++;
        if (session.skill === 'WRITING') writingSessions++;

        if (session.startedAt && session.endedAt) {
          const start = new Date(session.startedAt.includes('Z') ? session.startedAt : `${session.startedAt}Z`).getTime();
          const end = new Date(session.endedAt.includes('Z') ? session.endedAt : `${session.endedAt}Z`).getTime();
          if (end > start) {
            totalDurationMs += (end - start);
            durationCount++;
          }
        }
      }
    });

    const averageDurationMs = durationCount > 0 ? (totalDurationMs / durationCount) : 0;
    const averageDurationMin = Math.round(averageDurationMs / 60000);

    return {
      total: expertSessions.length,
      completed: completedSessions,
      speaking: speakingSessions,
      writing: writingSessions,
      averageDurationMin
    };
  }, [expertSessions]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Không tìm thấy giáo viên</p>
        <Button variant="link" onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  const set = <K extends keyof UpdateExpertRequest>(key: K, value: UpdateExpertRequest[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const overall = calcOverall(
    form.bandReading ?? 0,
    form.bandListening ?? 0,
    form.bandWriting ?? 0,
    form.bandSpeaking ?? 0,
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let avatarUrl = form.avatarUrl;
      if (avatarFile) avatarUrl = await uploadMedia(avatarFile);

      const uploadedCerts: string[] = await Promise.all(certFiles.map((f) => uploadMedia(f)));
      const certificates = [...existingCerts, ...uploadedCerts];

      await updateExpert(expert.id, { ...form, avatarUrl, certificates });
      queryClient.invalidateQueries({ queryKey: ['admin-experts'] });
      toast.success('Cập nhật thành công!');
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  const statusColor = expert.status === 'AVAILABLE' ? 'bg-emerald-400' : expert.status === 'BUSY' ? 'bg-amber-400' : 'bg-gray-300';
  const statusLabel = expert.status === 'AVAILABLE' ? 'Online' : expert.status === 'BUSY' ? 'Bận' : 'Offline';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{expert.displayName || 'Giáo viên'}</h1>
            <p className="text-sm text-gray-500">{expert.email || '-'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* ── Left Col: Profile Card + Nav ── */}
        <aside className="md:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Avatar area with gradient bg */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6 pt-8 pb-6 flex flex-col items-center">
              <div className="relative group h-28 w-28 mb-3">
                <Avatar className="h-full w-full ring-4 ring-white shadow-lg">
                  <AvatarImage src={avatarPreview || expert.avatarUrl} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-indigo-200 to-purple-200 text-indigo-700">
                    {(expert.displayName || 'X')[0]}
                  </AvatarFallback>
                </Avatar>

                {/* Status dot */}
                <span className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-white ${statusColor}`} />
              </div>
              <h3 className="font-bold text-gray-900">{expert.displayName}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{statusLabel}</p>
            </div>

            {/* Stats */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${expert.enabled ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                  Tài khoản
                </span>
                <Badge className={`text-[11px] font-medium border-0 ${expert.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {expert.enabled ? 'Hoạt động' : 'Vô hiệu hóa'}
                </Badge>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center py-3 rounded-xl bg-gray-50">
                  <p className="text-xl font-bold text-gray-800">{expert.totalSessions || 0}</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">Bài chấm</p>
                </div>
                <div className="text-center py-3 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xl font-bold text-gray-800">{(expert.rating ?? 0).toFixed(1)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">Đánh giá</p>
                </div>
              </div>
            </div>
          </div>

          {/* Anchor nav */}
          <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-0.5 sticky top-6 hidden md:block">
            {[
              { href: '#stats', icon: BarChart3, label: 'Thống kê hiệu suất' },
              { href: '#info', icon: User, label: 'Thông tin chuyên môn' },
              { href: '#certs', icon: Award, label: 'Bằng cấp & Chứng chỉ' },
              { href: '#reviews', icon: MessageSquare, label: 'Đánh giá', count: sessionsWithReview.length },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all group"
              >
                <item.icon className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <span className="flex-1">{item.label}</span>
                {item.count != null && (
                  <span className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
                    {item.count}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </aside>

        <div className="md:col-span-9 space-y-5 scroll-smooth">
          {/* Performance Stats */}
          <section id="stats" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Thống kê hiệu suất</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tiến độ</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-gray-900">{stats.completed}</span>
                    <span className="text-sm font-medium text-gray-400 mb-1">/ {stats.total} bài</span>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Speaking</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.speaking} <span className="text-sm font-medium text-gray-400">bài</span></p>
                </div>
                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Writing</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.writing} <span className="text-sm font-medium text-gray-400">bài</span></p>
                </div>
                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tốc độ trung bình</p>
                  <div className="flex items-center gap-2">
                    <TimerReset className="h-5 w-5 text-gray-400" />
                    <span className="text-2xl font-bold text-gray-900">{stats.averageDurationMin > 0 ? stats.averageDurationMin : '-'} <span className="text-sm font-medium text-gray-400">phút</span></span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Professional Info */}
          <section id="info" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50">
                <Briefcase className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Thông tin chuyên môn</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tên hiển thị</Label>
                  <Input value={form.displayName || ''} readOnly className="h-10 bg-gray-50 focus-visible:ring-0 cursor-default text-gray-700 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Năm kinh nghiệm
                  </Label>
                  <Input type="number" value={form.yearsExperience ?? 0} readOnly className="h-10 bg-gray-50 focus-visible:ring-0 cursor-default text-gray-700 font-medium" />
                </div>
              </div>

              {/* IELTS Bands */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Điểm IELTS</Label>
                <div className="grid grid-cols-5 gap-3">
                  {BAND_FIELDS.map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-[11px] text-gray-400 font-medium">{label}</Label>
                      <Input
                        type="number" step={0.5} min={0} max={9}
                        className="text-center font-mono h-10 text-sm bg-gray-50 focus-visible:ring-0 cursor-default text-gray-700"
                        value={form[key] ?? 0}
                        readOnly
                      />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-indigo-600 uppercase">Overall</Label>
                    <div className="h-10 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-md flex items-center justify-center font-bold text-indigo-700 text-base">
                      {overall.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Giới thiệu bản thân</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border border-gray-200 p-3.5 text-sm outline-none transition-all resize-none bg-gray-50 text-gray-700 cursor-default"
                  value={form.bio || ''}
                  readOnly
                  placeholder="Giáo viên chưa cập nhật giới thiệu bản thân..."
                />
              </div>
            </div>
          </section>

          {/* Certificates */}
          <section id="certs" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-50">
                  <Award className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800">Bằng cấp & Chứng chỉ</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Các chứng chỉ chuyên môn của giáo viên</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {existingCerts.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <Award className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">Chưa có chứng chỉ nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {existingCerts.map((url, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-xl border border-gray-100 overflow-hidden bg-gray-50 shadow-sm">
                      <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Reviews */}
          <section id="reviews" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-50">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-800">Phiên chấm & Đánh giá</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{expertSessions.length} phiên · {sessionsWithReview.length} có review</p>
              </div>
            </div>
            <div className="p-6">
              {sessionsWithReview.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400">Chưa có đánh giá nào từ học viên</p>
                  <p className="text-xs text-gray-300 mt-1">Tổng phiên đã chấm: {expertSessions.length}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 mb-2">
                    Hiển thị {sessionsWithReview.length} đánh giá từ học viên sau khi chấm xong
                  </p>
                  {sessionsWithReview.map((s) => (
                    <div key={s.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-2 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">{s.userDisplayName || 'Học viên ẩn danh'}</span>
                        <span className="text-[11px] text-gray-400">{formatSessionDate(s.endedAt || s.submittedAt || s.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.userRating ? (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < s.userRating! ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Chưa chấm sao</span>
                        )}
                        <span className="text-[11px] text-gray-400">· {s.skill} · #{s.id}</span>
                      </div>
                      {s.userComment && s.userComment.trim() ? (
                        <p className="text-sm text-gray-600 leading-relaxed">{s.userComment}</p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Không có bình luận.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
