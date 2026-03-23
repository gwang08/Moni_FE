'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DailyVideoCall } from '@/components/video/daily-video-call';
import { Send, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { ScoringSession } from '@/types/expert.types';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ sessionId: string }>;
}

const SPEAKING_CRITERIA = [
  { label: 'Fluency & Coherence (FC)', key: 'fluency' },
  { label: 'Lexical Resource (LR)', key: 'vocabulary' },
  { label: 'Grammatical Range (GRA)', key: 'grammar' },
  { label: 'Pronunciation (PR)', key: 'pronunciation' },
];

const WRITING_CRITERIA = [
  { label: 'Task Response (TR)', key: 'taskResponse' },
  { label: 'Coherence & Cohesion (CC)', key: 'coherence' },
  { label: 'Lexical Resource (LR)', key: 'lexicalResource' },
  { label: 'Grammatical Range (GRA)', key: 'grammaticalRange' },
];

export default function ExpertSessionPage({ params }: Props) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<ScoringSession | null>(null);
  const [loading, setLoading] = useState(true);

  const skill = session?.skill || 'SPEAKING';
  const criteria = skill === 'WRITING' ? WRITING_CRITERIA : SPEAKING_CRITERIA;

  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch session details
  useEffect(() => {
    apiClient
      .get<ApiResponse<ScoringSession>>(`/api/v1/expert/sessions/${sessionId}`, true)
      .then((res) => {
        if (res.result) setSession(res.result);
      })
      .catch(() => toast.error('Không thể tải thông tin phiên'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Init scores when criteria changes
  useEffect(() => {
    setScores(Object.fromEntries(criteria.map((c) => [c.key, ''])));
  }, [skill]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    const missing = criteria.filter((c) => !scores[c.key]);
    if (missing.length > 0) {
      toast.error('Vui lòng điền đầy đủ điểm số');
      return;
    }
    if (!feedback.trim()) {
      toast.error('Vui lòng nhập nhận xét');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post<ApiResponse<unknown>>(
        `/api/v1/expert/sessions/${sessionId}/evaluate`,
        {
          ...Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, parseFloat(v)])),
          feedback,
          strengths,
          areasForImprovement,
        },
        true,
      );
      toast.success('Đã gửi đánh giá thành công!');
      router.push('/expert/dashboard');
    } catch {
      toast.error('Gửi đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left: Video call */}
      <div className="w-1/2 bg-gray-900 p-4">
        <DailyVideoCall
          roomUrl={session?.roomUrl || ''}
          onLeave={() => router.push('/expert/dashboard')}
          className="h-full"
        />
      </div>

      {/* Right: Scoring panel */}
      <div className="w-1/2 overflow-y-auto p-5 space-y-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Bảng chấm điểm</h2>
          <Badge variant="outline">Phiên #{sessionId}</Badge>
        </div>

        <Badge className="text-xs">{skill}</Badge>

        {/* Score inputs */}
        <Card className="p-4 space-y-3">
          <p className="text-sm font-semibold">Điểm số (0–9, bước 0.5)</p>
          {criteria.map((c) => (
            <div key={c.key} className="flex items-center gap-3">
              <Label className="text-xs w-52 shrink-0">{c.label}</Label>
              <Input
                type="number"
                min={0} max={9} step={0.5}
                value={scores[c.key] ?? ''}
                onChange={(e) => setScores((prev) => ({ ...prev, [c.key]: e.target.value }))}
                className="w-24"
                placeholder="0–9"
              />
            </div>
          ))}
        </Card>

        {/* Text fields */}
        <Card className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Nhận xét chung *</Label>
            <textarea
              className="w-full rounded-md border bg-white px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Nhận xét về bài làm của học viên..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Điểm mạnh</Label>
            <textarea
              className="w-full rounded-md border bg-white px-3 py-2 text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Những điểm tốt của học viên..."
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Cần cải thiện</Label>
            <textarea
              className="w-full rounded-md border bg-white px-3 py-2 text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Những điểm học viên cần cải thiện..."
              value={areasForImprovement}
              onChange={(e) => setAreasForImprovement(e.target.value)}
            />
          </div>
        </Card>

        <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang gửi...</>
          ) : (
            <><Send className="h-4 w-4 mr-2" />Gửi đánh giá</>
          )}
        </Button>
      </div>
    </div>
  );
}
