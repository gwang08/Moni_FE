'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Shuffle, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { SpeakingModeExpertGrid } from '@/components/speaking/speaking-mode-expert-grid';
import { SpeakingModeExpertInlineConfirm } from '@/components/speaking/speaking-mode-expert-inline-confirm';
import { getExperts, createScoringSession } from '@/lib/expert-api';
import { getWritingSubmissionDetail } from '@/lib/ai-api';
import { useAuthStore } from '@/store/auth-store';
import type { ExpertProfile } from '@/types/expert.types';

/** Giờ làm việc 8h-22h theo giờ VN. Ngoài khung này có thể không có kết quả ngay. */
function isWithinWorkingHours(): boolean {
  // Hàm chạy client-side, lấy giờ local. Đa số user VN ở GMT+7 → đúng. Nếu cần chính xác
  // tuyệt đối có thể tính qua Asia/Ho_Chi_Minh timezone, nhưng YAGNI cho giờ.
  const h = new Date().getHours();
  return h >= 8 && h < 22;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: number | null;
  expertCost: number | null;
}

export function WritingExpertSelectionDialog({ open, onOpenChange, submissionId, expertCost }: Props) {
  const router = useRouter();
  const { user, refreshProfile } = useAuthStore();
  const queryClient = useQueryClient();

  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState<ExpertProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch experts when dialog opens
  useEffect(() => {
    if (open && experts.length === 0) {
      setLoadingExperts(true);
      getExperts()
        .then(setExperts)
        .catch(() => toast.error('Không thể tải danh sách giảng viên'))
        .finally(() => setLoadingExperts(false));
    }
  }, [open, experts.length]);

  const handleBook = async (expert: ExpertProfile | null) => {
    if (!submissionId) return;
    setSubmitting(true);
    try {
      const sub = await getWritingSubmissionDetail(submissionId);
      await createScoringSession({
        expertId: expert?.id ?? null, // null → BE pick random AVAILABLE expert
        skill: 'WRITING',
        content: sub.essayContent,
        testId: sub.testId ?? undefined,
        writingSubmissionId: sub.submissionId,
      });
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['my-active-subscription'] });
      toast.success(
        expert
          ? 'Đã gửi bài cho giảng viên! Bài sẽ sớm được chấm trong giờ làm việc.'
          : 'Đã gửi ngẫu nhiên cho 1 giảng viên! Bài sẽ sớm được chấm trong giờ làm việc.',
      );
      onOpenChange(false);
      setConfirming(null);
      router.push('/scoring-history');
    } catch {
      toast.error(expert ? 'Không thể tạo phiên chấm' : 'Không tìm được giảng viên, thử chọn thủ công');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setConfirming(null);
      setSearch('');
    }
    onOpenChange(v);
  };

  const filtered = experts.filter(
    (e) => !search.trim() || e.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <VisuallyHidden>
          <DialogTitle>Chọn giảng viên chấm Writing</DialogTitle>
        </VisuallyHidden>
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
            onClick={() => handleBook(null)}
            disabled={submitting}
            className="w-full mb-3 gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
          >
            <Shuffle className="h-4 w-4" />
            {submitting ? 'Đang gửi...' : 'Gửi ngẫu nhiên cho giảng viên'}
          </Button>
        )}

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

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            experts={filtered}
            expertCost={expertCost}
            onBook={setConfirming}
            onDetail={(e) => router.push(`/experts/${e.id}`)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
