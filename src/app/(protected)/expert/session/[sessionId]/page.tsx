'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DailyVideoCall } from '@/components/video/daily-video-call';
import { Send, Loader2, FileText, PenLine } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { uploadMedia } from '@/lib/admin-api';
import { useAuthStore } from '@/store/auth-store';
import type { ApiResponse } from '@/types/auth.types';
import type { ScoringSession } from '@/types/expert.types';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ZoomIn } from 'lucide-react';

interface TestQuestion {
  id: number;
  content: string;
  position: number;
  part: number;
}

interface WritingPromptData {
  prompt: string;
  chartImageUrl: string | null;
  taskType: 1 | 2;
}

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

  const { user } = useAuthStore();
  const [session, setSession] = useState<ScoringSession | null>(null);
  const [loading, setLoading] = useState(true);

  const skill = session?.skill || 'SPEAKING';
  const criteria = skill === 'WRITING' ? WRITING_CRITERIA : SPEAKING_CRITERIA;

  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [questionsByPart, setQuestionsByPart] = useState<Record<number, TestQuestion[]>>({});
  const [showQuestions, setShowQuestions] = useState(true);
  const [writingPrompt, setWritingPrompt] = useState<WritingPromptData | null>(null);
  const [chartZoomOpen, setChartZoomOpen] = useState(false);
  const recordingBlobRef = useRef<Blob | null>(null);

  // Fetch session details
  useEffect(() => {
    apiClient
      .get<ApiResponse<ScoringSession>>(`/api/v1/expert/sessions/${sessionId}`, true)
      .then((res) => {
        if (res.result) {
          setSession(res.result);
          // Fetch test questions if testId is present
          if (res.result.testId) {
            apiClient
              .get<ApiResponse<{
                skill?: string;
                stimuli: {
                  title: string;
                  content: string;
                  mediaUrl?: string | null;
                  section?: number;
                  questionGroups: { questions: TestQuestion[] }[];
                }[];
              }>>(
                `/api/v1/tests/${res.result.testId}`,
                true,
              )
              .then((testRes) => {
                const groupedLog: Record<number, TestQuestion[]> = {};
                for (const s of testRes.result?.stimuli ?? []) {
                  const currentPart = s.section ?? 1;
                  if (!groupedLog[currentPart]) groupedLog[currentPart] = [];
                  for (const g of s.questionGroups ?? []) {
                    for (const q of g.questions ?? []) {
                      if (q.position !== 0) {
                        let cleanedContent = q.content;
                        // Remove leading step numbers (e.g., "1. ", "2. ")
                        cleanedContent = cleanedContent.replace(/^\d+\.\s*/, '');
                        groupedLog[currentPart].push({ ...q, content: cleanedContent, part: currentPart });
                      }
                    }
                  }
                }
                // Sort within each part
                for (const pt in groupedLog) {
                  groupedLog[pt].sort((a, b) => a.position - b.position);
                }
                setQuestionsByPart(groupedLog);

                // Extract writing prompt from first stimulus (writing tests have 1 stimulus)
                if (res.result?.skill === 'WRITING') {
                  const firstStimulus = testRes.result?.stimuli?.[0];
                  if (firstStimulus) {
                    const section = firstStimulus.section ?? 2;
                    setWritingPrompt({
                      prompt: firstStimulus.content ?? firstStimulus.title ?? '',
                      chartImageUrl: firstStimulus.mediaUrl ?? null,
                      taskType: section === 1 ? 1 : 2,
                    });
                  }
                }
              })
              .catch(() => {});
          }
        }
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
      // Upload expert recording if available
      if (recordingBlobRef.current) {
        try {
          const file = new File([recordingBlobRef.current], `expert-recording-${sessionId}.webm`, { type: 'audio/webm' });
          const url = await uploadMedia(file);
          await apiClient.post(`/api/v1/expert/sessions/${sessionId}/recording`, { expertRecordingUrl: url }, true);
        } catch { /* non-fatal */ }
      }
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

  // Count words in plain text (strip HTML tags first)
  const essayWordCount = (session?.content ?? '')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left panel: Writing essay view OR Speaking video call */}
      {skill === 'WRITING' ? (
        <div className="w-1/2 flex flex-col gap-0 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 border-r border-teal-100 overflow-hidden">
          {/* Đề bài section */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center shadow-sm">
                <FileText className="h-4 w-4 text-teal-600" />
              </div>
              <span className="text-sm font-bold text-teal-800">
                Đề bài {writingPrompt ? `— Task ${writingPrompt.taskType}` : ''}
              </span>
            </div>

            <div className="rounded-xl bg-teal-50 border border-teal-100 p-4">
              {writingPrompt ? (
                <div
                  className="text-[13px] text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: writingPrompt.prompt }}
                />
              ) : (
                <p className="text-xs text-gray-400 italic">Không có thông tin đề bài.</p>
              )}
            </div>

            {/* Chart image (Task 1 only) */}
            {writingPrompt?.chartImageUrl && (
              <>
                <div
                  className="group relative rounded-xl overflow-hidden border border-teal-100 cursor-zoom-in hover:border-teal-300 transition-all shadow-sm bg-white"
                  onClick={() => setChartZoomOpen(true)}
                >
                  <Image
                    src={writingPrompt.chartImageUrl}
                    alt="Biểu đồ đề bài"
                    width={500}
                    height={320}
                    className="w-full object-contain bg-white p-2"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg">
                      <ZoomIn className="h-4 w-4 text-teal-600" />
                    </div>
                  </div>
                </div>
                <Dialog open={chartZoomOpen} onOpenChange={setChartZoomOpen}>
                  <DialogContent className="max-w-3xl rounded-2xl">
                    <Image
                      src={writingPrompt.chartImageUrl}
                      alt="Biểu đồ đề bài (phóng to)"
                      width={800}
                      height={600}
                      className="w-full object-contain"
                      unoptimized
                    />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-teal-100 mx-5" />

          {/* Bài viết section */}
          <div className="flex-1 flex flex-col p-5 gap-3 min-h-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-sm">
                  <PenLine className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-teal-800">Bài viết</span>
              </div>
              <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-xs font-medium">
                {essayWordCount} từ
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl bg-white border border-teal-100 p-4 min-h-0">
              {session?.content ? (
                <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {session.content.replace(/<[^>]*>/g, '')}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic">Không có nội dung bài viết.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-1/2 bg-gray-900 p-1">
          <DailyVideoCall
            roomUrl={session?.roomUrl || ''}
            userName={user?.fullName || 'Giảng viên'}
            onJoined={() => setInCall(true)}
            onLeave={() => { if (inCall) router.push('/expert/dashboard'); }}
            enableRecording
            onRecordingReady={(blob) => { recordingBlobRef.current = blob; }}
            className="h-full"
          />
        </div>
      )}

      {/* Right: Scoring panel */}
      <div className="w-1/2 overflow-y-auto p-5 space-y-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Bảng chấm điểm</h2>
          <Badge variant="outline">Phiên #{sessionId}</Badge>
        </div>

        <Badge className="text-xs">{skill}</Badge>

        {/* Test questions (collapsible) */}
        {Object.keys(questionsByPart).length > 0 && (
          <Card className="p-4 border-gray-200 shadow-sm rounded-xl bg-white">
            <button
              type="button"
              onClick={() => setShowQuestions((v) => !v)}
              className="flex items-center justify-between w-full font-bold text-gray-800 text-[15px]"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>Câu hỏi đề thi</span>
                <Badge variant="secondary" className="ml-2 font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                  {Object.values(questionsByPart).flat().length} câu
                </Badge>
              </div>
              {showQuestions ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </button>
            
            {showQuestions && (
              <div className="mt-4 space-y-5">
                {Object.entries(questionsByPart).map(([part, qs]) => (
                  <div key={part}>
                    <h4 className="text-sm font-bold text-gray-700 mb-2 pb-1 border-b border-gray-100">
                      {skill === 'SPEAKING' ? `Part ${part}` : `Task ${part}`}
                    </h4>
                    <ol className="space-y-2 list-outside ml-4">
                      {qs.map((q, i) => (
                        <li key={q.id} className="text-[13px] text-gray-600 leading-relaxed list-decimal marker:text-emerald-500 marker:font-semibold">
                          <span className="text-gray-800 ml-1">{q.content}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Score inputs */}
        <Card className="p-5 border-gray-200 shadow-sm rounded-xl bg-white">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-[15px] font-bold text-gray-800">Đánh giá tiêu chí</h3>
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Thang điểm 0–9</span>
          </div>
          
          <div className="space-y-3.5">
            {criteria.map((c) => (
              <div key={c.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 border border-gray-100 hover:border-emerald-200 transition-colors">
                <Label className="text-[13px] font-semibold text-gray-700 truncate mr-3">{c.label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0} max={9} step={0.5}
                    value={scores[c.key] ?? ''}
                    onChange={(e) => setScores((prev) => ({ ...prev, [c.key]: e.target.value }))}
                    className="w-20 h-9 font-bold text-center text-emerald-700 bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    placeholder="0.0"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Text fields */}
        <Card className="p-5 border-gray-200 shadow-sm rounded-xl bg-white space-y-5">
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-gray-800 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">💬</span>
              Nhận xét chung <span className="text-red-500">*</span>
            </Label>
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-[13px] leading-relaxed min-h-[100px] resize-y focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-gray-400"
              placeholder="Viết nhận xét tổng quan về bài làm của học viên để giúp họ định hướng rõ ràng nhất..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="text-[16px]">✨</span> Điểm mạnh
              </Label>
              <textarea
                className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-4 py-3 text-[13px] leading-relaxed min-h-[80px] resize-y focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-emerald-700/40"
                placeholder="Điều học viên đã làm rất tốt..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-orange-700 flex items-center gap-1.5">
                <span className="text-[16px]">💡</span> Cần cải thiện
              </Label>
              <textarea
                className="w-full rounded-xl border border-orange-100 bg-orange-50/30 px-4 py-3 text-[13px] leading-relaxed min-h-[80px] resize-y focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-orange-700/40"
                placeholder="Những mặt học viên cần chú ý khắc phục..."
                value={areasForImprovement}
                onChange={(e) => setAreasForImprovement(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Button className="w-full h-12 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-[14px] shadow-sm tracking-wide gap-2 mb-8" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Hệ thống đang lưu đánh giá...</>
          ) : (
            <><Send className="h-4 w-4" /> Gửi kết quả chấm điểm</>
          )}
        </Button>
      </div>
    </div>
  );
}
