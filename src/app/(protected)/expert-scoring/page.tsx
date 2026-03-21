'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExpertCard } from '@/components/expert/expert-card';
import { CreditConfirmDialog } from '@/components/scoring/credit-confirm-dialog';
import { getExperts, createScoringSession } from '@/lib/expert-api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import type { ExpertProfile } from '@/types/expert.types';

type Filter = 'ALL' | 'WRITING' | 'SPEAKING';

const EXPERT_CREDIT_COST = 50;

export default function ExpertScoringPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selected, setSelected] = useState<ExpertProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getExperts()
      .then(setExperts)
      .catch(() => toast.error('Không thể tải danh sách giảng viên'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = experts.filter((e) => {
    if (filter === 'ALL') return true;
    return e.specialization === filter || e.specialization === 'BOTH';
  });

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const session = await createScoringSession({
        expertId: selected.id,
        skill: 'SPEAKING',
        content: '',
      });
      router.push(`/expert-scoring/queue/${session.id}`);
    } catch {
      toast.error('Không thể tạo phiên chấm, vui lòng thử lại');
    } finally {
      setSubmitting(false);
      setSelected(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Chấm điểm với Giảng viên</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Chọn giảng viên phù hợp để được chấm điểm qua video call
        </p>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6">
        {(['ALL', 'WRITING', 'SPEAKING'] as Filter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? 'Tất cả' : f === 'WRITING' ? 'Writing' : 'Speaking'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          Không có giảng viên nào phù hợp.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} onSelect={setSelected} />
          ))}
        </div>
      )}

      <CreditConfirmDialog
        open={!!selected}
        onClose={() => setSelected(null)}
        onConfirm={handleConfirm}
        serviceName={`Chấm điểm với ${selected?.displayName ?? ''}`}
        creditCost={EXPERT_CREDIT_COST}
        currentBalance={user?.credit ?? 0}
      />

      {submitting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 text-center">
            <p className="font-medium">Đang tạo phiên chấm...</p>
          </div>
        </div>
      )}
    </div>
  );
}
