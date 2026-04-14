'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { SpeakingModeExpertGrid } from '@/components/speaking/speaking-mode-expert-grid';
import { SpeakingModeExpertInlineConfirm } from '@/components/speaking/speaking-mode-expert-inline-confirm';
import { getExperts, createScoringSession } from '@/lib/expert-api';
import { getWritingSubmissionDetail } from '@/lib/ai-api';
import { useAuthStore } from '@/store/auth-store';
import type { ExpertProfile } from '@/types/expert.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: number | null;
  expertCost: number | null;
}

export function WritingExpertSelectionDialog({ open, onOpenChange, submissionId, expertCost }: Props) {
  const router = useRouter();
  const { user, refreshProfile } = useAuthStore();

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

  const handleBook = async (expert: ExpertProfile) => {
    if (!submissionId) return;
    setSubmitting(true);
    try {
      const sub = await getWritingSubmissionDetail(submissionId);
      await createScoringSession({
        expertId: expert.id,
        skill: 'WRITING',
        content: sub.essayContent,
        testId: sub.testId ?? undefined,
        writingSubmissionId: sub.submissionId,
      });
      await refreshProfile();
      toast.success('Đã gửi bài cho giảng viên!');
      onOpenChange(false);
      setConfirming(null);
      router.push('/scoring-history');
    } catch {
      toast.error('Không thể tạo phiên chấm');
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
        <h3 className="text-lg font-bold mb-3">Chọn giảng viên chấm Writing</h3>

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
