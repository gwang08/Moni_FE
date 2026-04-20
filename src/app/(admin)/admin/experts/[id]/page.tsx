'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, Camera, ImagePlus, X, Save, Star, MessageSquare, User } from 'lucide-react';
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

  // Fetch expert data
  const { data: experts = [], isLoading } = useQuery({
    queryKey: ['admin-experts'],
    queryFn: getAdminExperts,
  });

  const expert = experts.find(e => e.id === expertId);

  // Sessions của expert này (lọc client-side từ danh sách toàn hệ thống)
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
        <p className="text-muted-foreground">Không tìm thấy giám khảo</p>
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{expert.displayName || 'Chuyên gia'}</h1>
          <p className="text-sm text-muted-foreground">{expert.email || '-'}</p>
        </div>
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Col: Avatar/Status card + sticky Anchor Nav */}
        <aside className="md:col-span-3 space-y-4">
          <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center">
             <div className="relative group h-32 w-32 mb-4">
                <Avatar className="h-full w-full border-4 border-white shadow-md">
                  <AvatarImage src={avatarPreview || expert.avatarUrl} />
                  <AvatarFallback className="text-2xl font-bold">{(expert.displayName || 'X')[0]}</AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }} 
                  />
                </label>
             </div>
             
             <div className="w-full space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Trạng thái tài khoản</span>
                  <Badge variant={expert.enabled ? 'default' : 'secondary'} className={expert.enabled ? 'bg-green-500 text-white hover:bg-green-600 border-none' : ''}>
                    {expert.enabled ? 'Hoạt động' : 'Vô hiệu hóa'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Đang làm việc</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${expert.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="capitalize">{(expert.status || 'OFFLINE').toLowerCase()}</span>
                  </div>
                </div>
                <div className="pt-4 border-t grid grid-cols-2 gap-4 text-center">
                   <div>
                      <p className="text-lg font-bold">{expert.totalSessions || 0}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">Bài đã chấm</p>
                   </div>
                   <div>
                      <p className="text-lg font-bold">{(expert.rating ?? 0).toFixed(1)}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">Đánh giá</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Sticky anchor nav — scroll tới section trong right col */}
          <nav className="bg-white rounded-xl border shadow-sm p-2 space-y-0.5 sticky top-6 hidden md:block">
            <a href="#info" className="block px-3 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-50 hover:text-indigo-600 border-l-2 border-transparent hover:border-indigo-500 transition-all">
              Thông tin chuyên môn
            </a>
            <a href="#certs" className="block px-3 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-50 hover:text-indigo-600 border-l-2 border-transparent hover:border-indigo-500 transition-all">
              Bằng cấp & Chứng chỉ
            </a>
            <a href="#reviews" className="flex items-center justify-between px-3 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-50 hover:text-indigo-600 border-l-2 border-transparent hover:border-indigo-500 transition-all">
              <span>Đánh giá</span>
              <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-1.5">{sessionsWithReview.length}</span>
            </a>
          </nav>
        </aside>

        {/* Right Col: stacked sections */}
        <div className="md:col-span-9 space-y-5 scroll-smooth">
          <section id="info" className="bg-white rounded-xl border shadow-sm overflow-hidden scroll-mt-6">
            <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-500" />
              <h3 className="font-bold text-sm">Thông tin chuyên môn</h3>
            </div>
            <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Tên hiển thị</Label>
                      <Input value={form.displayName || ''} onChange={e => set('displayName', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Số năm kinh nghiệm</Label>
                      <Input type="number" value={form.yearsExperience ?? 0} onChange={e => set('yearsExperience', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold text-xs text-gray-600">Điểm IELTS</Label>
                    <div className="grid grid-cols-5 gap-3">
                      {BAND_FIELDS.map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">{label}</Label>
                          <Input 
                            type="number" step={0.5} min={0} max={9}
                            className="text-center font-mono h-9"
                            value={form[key] ?? 0} 
                            onChange={e => set(key, parseFloat(e.target.value) || 0)} 
                          />
                        </div>
                      ))}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-primary font-bold uppercase">Overall</Label>
                        <div className="h-9 bg-primary/5 border border-primary/20 rounded-md flex items-center justify-center font-bold text-primary text-sm">
                          {overall.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Giới thiệu bản thân</Label>
                    <textarea 
                      className="w-full min-h-[120px] rounded-md border p-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                      value={form.bio || ''}
                      onChange={e => set('bio', e.target.value)}
                      placeholder="Viết vài dòng giới thiệu về kinh nghiệm và kỹ năng..."
                    />
                  </div>
                </div>
            </div>
          </section>

          <section id="certs" className="bg-white rounded-xl border shadow-sm overflow-hidden scroll-mt-6">
            <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-sm">Bằng cấp & Chứng chỉ</h3>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-muted-foreground">Tải lên bằng cấp, chứng chỉ IELTS để tăng độ tin cậy.</p>
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('cert-upload')?.click()} className="h-8 text-xs">
                    <ImagePlus className="h-3.5 w-3.5 mr-2" />
                    Thêm ảnh
                  </Button>
                  <input 
                    id="cert-upload" type="file" multiple className="hidden" 
                    onChange={e => {
                      const files = Array.from(e.target.files ?? []);
                      setCertFiles(prev => [...prev, ...files]);
                      setCertPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Existing */}
                  {existingCerts.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg border overflow-hidden bg-gray-50">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setExistingCerts(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {/* New */}
                  {certPreviews.map((url, i) => (
                    <div key={`new-${i}`} className="relative group aspect-square rounded-lg border-2 border-dashed border-primary/30 overflow-hidden bg-primary/5">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          setCertFiles(prev => prev.filter((_, idx) => idx !== i));
                          setCertPreviews(prev => prev.filter((_, idx) => idx !== i));
                        }}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
            </div>
          </section>

          <section id="reviews" className="bg-white rounded-xl border shadow-sm overflow-hidden scroll-mt-6">
            <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-transparent border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <div>
                  <h3 className="font-bold text-sm">Phiên chấm & Đánh giá</h3>
                  <p className="text-[11px] text-gray-500">{expertSessions.length} phiên · {sessionsWithReview.length} có review</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
                {sessionsWithReview.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Chưa có đánh giá nào từ học viên.</p>
                    <p className="text-xs mt-1">Tổng phiên đã chấm: {expertSessions.length}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Hiển thị {sessionsWithReview.length} đánh giá từ học viên sau khi chấm xong.
                    </p>
                    <div className="space-y-3">
                      {sessionsWithReview.map((s) => (
                        <div key={s.id} className="rounded-lg border bg-white p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-700">{s.userDisplayName || 'Học viên ẩn danh'}</span>
                            <span className="text-muted-foreground">{formatSessionDate(s.endedAt || s.submittedAt || s.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {s.userRating ? (
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`h-3.5 w-3.5 ${i < s.userRating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">Chưa chấm sao</span>
                            )}
                            <span className="text-[11px] text-muted-foreground">· {s.skill} · phiên #{s.id}</span>
                          </div>
                          {s.userComment && s.userComment.trim() ? (
                            <p className="text-sm text-gray-700 leading-relaxed">{s.userComment}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Học viên không để lại bình luận.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
