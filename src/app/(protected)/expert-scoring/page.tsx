'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ExpertCard } from '@/components/expert/expert-card';
import { CreditConfirmDialog } from '@/components/scoring/credit-confirm-dialog';
import { getExperts, createScoringSession } from '@/lib/expert-api';
import { getServices } from '@/lib/payment-api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import type { ExpertProfile } from '@/types/expert.types';

export default function ExpertScoringPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const { user } = useAuthStore();
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ExpertProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [expertCost, setExpertCost] = useState(0);

  useEffect(() => {
    getExperts()
      .then(setExperts)
      .catch(() => toast.error('Không thể tải danh sách giảng viên'))
      .finally(() => setLoading(false));
    getServices()
      .then((services) => {
        const s = services.find((sv) => sv.serviceCode === 'EXPERT_SPEAKING_SCORE');
        if (s) setExpertCost(s.creditCost);
      })
      .catch(() => {});
  }, []);

  const filtered = experts.filter((e) => {
    if (e.status === 'OFFLINE') return false;
    if (search.trim()) {
      return e.displayName.toLowerCase().includes(search.toLowerCase().trim());
    }
    return true;
  });

  const { refreshProfile } = useAuthStore();

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const session = await createScoringSession({
        expertId: selected.id,
        skill: 'SPEAKING',
        content: '',
        testId: testId ? Number(testId) : undefined,
      });
      await refreshProfile(); // Update credit in header after deduction
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

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm giảng viên theo tên..."
          className="pl-9"
        />
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
        creditCost={expertCost}
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
