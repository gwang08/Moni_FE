'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search } from 'lucide-react';
import { getExpertsForSpeaking, createScoringSession } from '@/lib/expert-api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { SpeakingModeExpertGrid } from './speaking-mode-expert-grid';
import { SpeakingModeExpertInlineConfirm } from './speaking-mode-expert-inline-confirm';
import type { ExpertProfile } from '@/types/expert.types';
import type { ServiceQuotaResponse } from '@/lib/payment-api';

interface Props {
  open: boolean;
  testId: string;
  aiQuota?: ServiceQuotaResponse | null;
  expertCost?: number | null;
  onSelectAI: () => void;
  onClose: () => void;
}

export function SpeakingModeDialog({ open, testId, aiQuota = null, expertCost = null, onSelectAI, onClose }: Props) {
  const router = useRouter();
  const { user, refreshProfile } = useAuthStore();
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

        {step === 1 && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            {/* AI option */}
            <button
              onClick={onSelectAI}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all text-left"
            >
              <span className="text-4xl">🤖</span>
              <div className="space-y-1 text-center">
                <p className="font-semibold text-sm text-blue-900">Luyện tập với AI</p>
                <p className="text-xs text-blue-700/70">Tự ghi âm và nhận phản hồi từ AI ngay lập tức</p>
              </div>
              {aiQuota != null && (
                aiQuota.usedToday ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-800 bg-blue-200/60 px-2 py-0.5 rounded-full">
                    {aiQuota.effectiveCost}{' '}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/currency.webp" alt="credit" className="h-3.5 w-3.5 inline" />
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Miễn phí
                  </span>
                )
              )}
            </button>

            {/* Expert option */}
            <button
              onClick={handleGoToExpertList}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 transition-all text-left"
            >
              <span className="text-4xl">👨‍🏫</span>
              <div className="space-y-1 text-center">
                <p className="font-semibold text-sm text-orange-900">Nói với Giảng viên</p>
                <p className="text-xs text-orange-700/70">Video call trực tiếp và được chấm bởi giảng viên</p>
              </div>
              {expertCost != null && (
                <span className="flex items-center gap-1 text-xs font-medium text-orange-800 bg-orange-200/60 px-2 py-0.5 rounded-full">
                  {expertCost} <img src="/currency.webp" alt="credit" className="h-3.5 w-3.5 inline" />
                </span>
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 mt-1">
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

            {/* Credit confirm */}
            {confirming && (
              <SpeakingModeExpertInlineConfirm
                expert={confirming}
                cost={expertCost ?? 0}
                balance={user?.credit ?? 0}
                submitting={submitting}
                onConfirm={() => handleBook(confirming)}
                onCancel={() => setConfirming(null)}
              />
            )}

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
                expertCost={expertCost}
                onBook={(e) => setConfirming(e)}
                onDetail={(e) => { onClose(); router.push(`/experts/${e.id}?testId=${testId}`); }}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
