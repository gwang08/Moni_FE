'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Mic, GraduationCap, Sparkles, ShieldCheck } from 'lucide-react';
import { getExpertsForSpeaking, createScoringSession } from '@/lib/expert-api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { SpeakingModeExpertGrid } from './speaking-mode-expert-grid';
import { SpeakingModeExpertInlineConfirm } from './speaking-mode-expert-inline-confirm';
import type { ExpertProfile } from '@/types/expert.types';
import type { ServiceQuotaResponse } from '@/lib/payment-api';
import type { UserSubscriptionResponse } from '@/types/subscription.types';

/** AI unlimited cap: same constant as writing dialog. */
const AI_UNLIMITED_CAP = 500;

interface Props {
  open: boolean;
  testId: string;
  aiQuota?: ServiceQuotaResponse | null;
  expertCost?: number | null;
  activeSubscription?: UserSubscriptionResponse | null;
  onSelectAI: () => void;
  onClose: () => void;
}

export function SpeakingModeDialog({ open, testId, aiQuota = null, expertCost = null, activeSubscription = null, onSelectAI, onClose }: Props) {
  const router = useRouter();
  const { user, refreshProfile } = useAuthStore();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState<ExpertProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) { setStep(1); setSearch(''); setConfirming(null); setExperts([]); }
  }, [open]);

  const handleGoToExpertList = () => {
    setStep(2);
    setLoadingExperts(true);
    getExpertsForSpeaking()
      .then((list) => setExperts(list))
      .catch(() => toast.error('Không thể tải danh sách giảng viên'))
      .finally(() => setLoadingExperts(false));
  };

  // Auto-refetch expert list every 15s khi đang ở step chọn giảng viên,
  // để cập nhật trạng thái online/offline real-time mà không cần đóng/mở dialog.
  useEffect(() => {
    if (!open || step !== 2) return;
    const refresh = () => {
      getExpertsForSpeaking()
        .then((list) => setExperts(list))
        .catch(() => {});
    };
    const id = setInterval(refresh, 15_000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [open, step]);

  const handleBook = async (expert: ExpertProfile) => {
    setSubmitting(true);
    try {
      const session = await createScoringSession({
        expertId: expert.id,
        skill: 'SPEAKING',
        content: '',
        testId: Number(testId),
      });
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['my-active-subscription'] });
      onClose();
      router.push(`/expert-scoring/queue/${session.id}`);
    } catch {
      toast.error('Không thể tạo phiên chấm, vui lòng thử lại');
    } finally {
      setSubmitting(false);
      setConfirming(null);
    }
  };

  const filtered = experts.filter((e) =>
    !search.trim() || e.displayName.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className={step === 2 ? 'sm:max-w-2xl' : 'sm:max-w-lg'}>
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => { setStep(1); setConfirming(null); }}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {step === 1 ? 'Chọn hình thức luyện tập' : 'Chọn giảng viên'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (() => {
          const hasFreeToday = !aiQuota || !aiQuota.usedToday;
          const subCoversAi = activeSubscription && (
            activeSubscription.remainAi === -1
              ? activeSubscription.usedAi < AI_UNLIMITED_CAP
              : activeSubscription.remainAi > 0
          );
          const canUseAI = hasFreeToday || subCoversAi;
          const hasExpertQuota = activeSubscription && activeSubscription.remainExpert > 0;

          let aiBadge: React.ReactNode;
          let aiBadgeColor = '';
          if (hasFreeToday) {
            aiBadge = 'Miễn phí 1 lượt/ngày';
            aiBadgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
          } else if (subCoversAi && activeSubscription) {
            const rem = activeSubscription.remainAi === -1
              ? AI_UNLIMITED_CAP - activeSubscription.usedAi
              : activeSubscription.remainAi;
            aiBadge = `Trong gói · còn ${rem} lượt`;
            aiBadgeColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
          } else {
            aiBadge = 'Cần mua gói →';
            aiBadgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
          }

          return (
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* AI option */}
              <button
                onClick={canUseAI ? onSelectAI : () => { onClose(); router.push('/payment'); }}
                className="group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-teal-100 bg-gradient-to-b from-teal-50/80 to-white hover:border-teal-300 hover:shadow-lg hover:shadow-teal-100/50 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-200/50 group-hover:scale-110 transition-transform">
                  <Mic className="h-7 w-7 text-white" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="font-bold text-sm text-gray-900">Luyện tập với AI</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Tự ghi âm và nhận phản hồi từ AI ngay lập tức</p>
                </div>
                <span className={`text-[11px] font-semibold border px-2.5 py-1 rounded-full ${aiBadgeColor}`}>
                  {aiBadge}
                </span>
              </button>

              {/* Expert option */}
              <button
                onClick={hasExpertQuota ? handleGoToExpertList : () => { onClose(); router.push('/payment'); }}
                className="group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-orange-100 bg-gradient-to-b from-orange-50/80 to-white hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/50 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-200/50 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="font-bold text-sm text-gray-900">Nói với Giảng viên</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Video call trực tiếp và được chấm bởi giảng viên</p>
                </div>
                {hasExpertQuota ? (
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                    Trong gói · còn {activeSubscription!.remainExpert} lượt
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    Cần mua gói →
                  </span>
                )}
              </button>
            </div>
          );
        })()}

        {step === 2 && (
          <div className="space-y-3 mt-1">
            {confirming ? (
              // Replace-mode: chỉ hiện confirm card, ẩn search + grid để modal không tràn viewport
              <SpeakingModeExpertInlineConfirm
                expert={confirming}
                cost={expertCost ?? 0}
                submitting={submitting}
                onConfirm={() => handleBook(confirming)}
                onCancel={() => setConfirming(null)}
              />
            ) : (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nhập tên giảng viên để tìm kiếm..."
                    className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50 hover:bg-gray-100/50 focus:bg-white focus:border-orange-300 focus:ring-4 focus:ring-orange-100 transition-all"
                  />
                </div>

                {/* Expert grid or loading skeleton */}
                {loadingExperts ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <SpeakingModeExpertGrid
                    experts={filtered}
                    onBook={(e) => setConfirming(e)}
                    onDetail={(e) => { onClose(); router.push(`/experts/${e.id}?testId=${testId}`); }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
