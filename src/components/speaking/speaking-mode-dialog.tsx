'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getServices } from '@/lib/payment-api';

interface Props {
  open: boolean;
  testId: string;
  onSelectAI: () => void;
  onClose: () => void;
}

export function SpeakingModeDialog({ open, testId, onSelectAI, onClose }: Props) {
  const router = useRouter();
  const [aiCost, setAiCost] = useState<number | null>(null);
  const [expertCost, setExpertCost] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    getServices()
      .then((services) => {
        const ai = services.find((s) => s.serviceCode === 'AI_SPEAKING_SCORE');
        const expert = services.find((s) => s.serviceCode === 'EXPERT_SPEAKING_SCORE');
        if (ai) setAiCost(ai.creditCost);
        if (expert) setExpertCost(expert.creditCost);
      })
      .catch(() => {});
  }, [open]);

  const handleSelectExpert = () => {
    onClose();
    router.push(`/expert-scoring?skill=SPEAKING&testId=${testId}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">Chọn hình thức luyện tập</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* AI card */}
          <button
            onClick={onSelectAI}
            className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all text-left group"
          >
            <span className="text-4xl">🤖</span>
            <div className="space-y-1 text-center">
              <p className="font-semibold text-sm text-blue-900">Luyện tập với AI</p>
              <p className="text-xs text-blue-700/70">Tự ghi âm và nhận phản hồi từ AI ngay lập tức</p>
            </div>
            {aiCost != null && (
              <span className="flex items-center gap-1 text-xs font-medium text-blue-800 bg-blue-200/60 px-2 py-0.5 rounded-full">
                {aiCost} <img src="/currency.webp" alt="credit" className="h-3.5 w-3.5 inline" />
              </span>
            )}
          </button>

          {/* Expert card */}
          <button
            onClick={handleSelectExpert}
            className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 transition-all text-left group"
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
      </DialogContent>
    </Dialog>
  );
}
