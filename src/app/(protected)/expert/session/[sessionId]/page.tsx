'use client';

// TODO: Left panel will embed Daily.co video call when roomUrl is available.
// Steps: fetch session → get roomUrl → DailyIframe.createFrame({ url: roomUrl })

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Video, Send, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ sessionId: string }>;
}

interface ScoreInput {
  label: string;
  key: string;
}

const SPEAKING_CRITERIA: ScoreInput[] = [
  { label: 'Fluency & Coherence (FC)', key: 'fluency' },
  { label: 'Lexical Resource (LR)', key: 'vocabulary' },
  { label: 'Grammatical Range (GRA)', key: 'grammar' },
  { label: 'Pronunciation (PR)', key: 'pronunciation' },
];

const WRITING_CRITERIA: ScoreInput[] = [
  { label: 'Task Response (TR)', key: 'taskResponse' },
  { label: 'Coherence & Cohesion (CC)', key: 'coherence' },
  { label: 'Lexical Resource (LR)', key: 'lexicalResource' },
  { label: 'Grammatical Range (GRA)', key: 'grammaticalRange' },
];

export default function ExpertSessionPage({ params }: Props) {
  const { sessionId } = use(params);
  const router = useRouter();

  // In a real scenario, fetch session details from API
  const skill: string = 'SPEAKING'; // Placeholder — would come from session data

  const criteria = skill === 'WRITING' ? WRITING_CRITERIA : SPEAKING_CRITERIA;

  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(criteria.map((c) => [c.key, '']))
  );
  const [feedback, setFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate all scores filled
    const missing = criteria.filter((c) => !scores[c.key]);
    if (missing.length > 0) {
      toast.error('Vui lòng điền đầy đủ điểm số');
      return;
    }
    if (!feedback.trim()) {
      toast.error('Vui lòng nhập nhận xét');
      return;
    }

    const evaluation = {
      ...Object.fromEntries(
        Object.entries(scores).map(([k, v]) => [k, parseFloat(v)])
      ),
      feedback,
      strengths,
      areasForImprovement,
    };

    setSubmitting(true);
    try {
      await apiClient.post<ApiResponse<unknown>>(
        `/api/v1/expert/sessions/${sessionId}/evaluate`,
        evaluation,
        true
      );
      toast.success('Đã gửi đánh giá thành công!');
      router.push('/expert/dashboard');
    } catch {
      toast.error('Gửi đánh giá thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left: Video placeholder */}
      <div className="w-1/2 bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="p-6 rounded-full bg-gray-700 inline-flex">
            <Video className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-white font-medium">Video Call</p>
          <p className="text-gray-400 text-sm">Daily.co sẽ được tích hợp tại đây</p>
          {/* TODO: Daily.co iframe container */}
          <div id="daily-container-expert" className="w-full h-48 rounded-lg bg-gray-800" />
        </div>
      </div>

      {/* Right: Scoring panel */}
      <div className="w-1/2 overflow-y-auto p-5 space-y-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Bảng chấm điểm</h2>
          <Badge variant="outline">Phiên #{sessionId}</Badge>
        </div>

        {/* Skill badge */}
        <Badge className="text-xs">{skill}</Badge>

        {/* Score inputs */}
        <Card className="p-4 space-y-3">
          <p className="text-sm font-semibold">Điểm số (0–9, bước 0.5)</p>
          {criteria.map((c) => (
            <div key={c.key} className="flex items-center gap-3">
              <Label className="text-xs w-52 shrink-0">{c.label}</Label>
              <Input
                type="number"
                min={0}
                max={9}
                step={0.5}
                value={scores[c.key]}
                onChange={(e) =>
                  setScores((prev) => ({ ...prev, [c.key]: e.target.value }))
                }
                className="w-24"
                placeholder="0–9"
              />
            </div>
          ))}
        </Card>

        {/* Text fields */}
        <Card className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Nhận xét chung</Label>
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

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting}
        >
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
