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
import { getWritingSubmissionDetail } from '@/lib/ai-api';
import { getSessionEvaluation } from '@/lib/expert-api';
import { useAuthStore } from '@/store/auth-store';
import type { ApiResponse } from '@/types/auth.types';
import type { ScoringSession, ExpertEvaluation } from '@/types/expert.types';
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
  const [criteriaFeedback, setCriteriaFeedback] = useState<Record<string, string>>({});
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
  const [existingEvaluation, setExistingEvaluation] = useState<ExpertEvaluation | null>(null);

  const isReadOnly = session?.status === 'COMPLETED' || session?.status === 'CANCELLED';

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

                // Extract writing prompt from exact task or fallback
                if (res.result?.skill === 'WRITING') {
                  const setPromptFromStimulus = (st: { title?: string; content?: string; mediaUrl?: string | null; section?: number }, forcedType?: 1 | 2) => {
                    const section = st.section ?? 2;
                    setWritingPrompt({
                      prompt: st.content ?? st.title ?? '',
                      chartImageUrl: st.mediaUrl ?? null,
                      taskType: forcedType ?? (section === 1 ? 1 : 2),
                    });
                  };

                  if (res.result.writingSubmissionId) {
                    getWritingSubmissionDetail(res.result.writingSubmissionId).then((sub) => {
                      const stimuli = testRes.result?.stimuli ?? [];
                      const targetSection = sub.taskType === 'TASK_1' ? 1 : 2;
                      const exactMatch = stimuli.find(s => s.section === targetSection);
                      if (exactMatch) {
                        setPromptFromStimulus(exactMatch, sub.taskType === 'TASK_1' ? 1 : 2);
                      } else if (testRes.result?.stimuli?.[0]) {
                        setPromptFromStimulus(testRes.result.stimuli[0], sub.taskType === 'TASK_1' ? 1 : 2);
                      }
                    }).catch(() => {
                      if (testRes.result?.stimuli?.[0]) setPromptFromStimulus(testRes.result.stimuli[0]);
                    });
                  } else if (testRes.result?.stimuli?.[0]) {
                    setPromptFromStimulus(testRes.result.stimuli[0]);
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

  // If session already completed, fetch saved evaluation and populate form (read-only)
  useEffect(() => {
    if (session?.status !== 'COMPLETED') return;
    getSessionEvaluation(Number(sessionId))
      .then((ev) => {
        setExistingEvaluation(ev);
        // Populate criteria scores
        const nextScores: Record<string, string> = {};
        criteria.forEach((c) => {
          const v = (ev as unknown as Record<string, number | undefined>)[c.key];
          nextScores[c.key] = v != null ? String(v) : '';
        });
        setScores(nextScores);

        // Parse compiled feedback (format: [NHẬN XÉT CHUNG]\n...\n\n[ĐÁNH GIÁ CHI TIẾT]\n- Label (score):\nfeedback...)
        const rawFeedback = ev.feedback || '';
        const generalMatch = rawFeedback.match(/\[NHẬN XÉT CHUNG\]\n([\s\S]*?)(?=\n\n\[ĐÁNH GIÁ CHI TIẾT\]|$)/);
        const detailSection = rawFeedback.split('[ĐÁNH GIÁ CHI TIẾT]')[1] ?? '';
        setFeedback(generalMatch?.[1]?.trim() ?? rawFeedback);

        // Extract per-criterion feedback blocks
        const perCrit: Record<string, string> = {};
        criteria.forEach((c) => {
          const escapedLabel = c.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const re = new RegExp(`- ${escapedLabel} \\([^)]*\\):\\n([\\s\\S]*?)(?=\\n- |$)`);
          const m = detailSection.match(re);
          if (m?.[1] && m[1].trim() !== 'Không có nhận xét thêm') {
            perCrit[c.key] = m[1].trim();
          }
        });
        setCriteriaFeedback(perCrit);

        setStrengths(ev.strengths ?? '');
        setAreasForImprovement(ev.areasForImprovement ?? '');
      })
      .catch(() => {/* evaluation may not exist */});
  }, [session?.status, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const compiledFeedback = `[NHẬN XÉT CHUNG]\n${feedback.trim()}\n\n[ĐÁNH GIÁ CHI TIẾT]\n${criteria.map(c => `- ${c.label} (${scores[c.key]}):\n${criteriaFeedback[c.key] || 'Không có nhận xét thêm'}`).join('\n\n')}`;

    setSubmitting(true);
    try {
      await apiClient.post<ApiResponse<unknown>>(
        `/api/v1/expert/sessions/${sessionId}/evaluate`,
        {
          ...Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, parseFloat(v)])),
          feedback: compiledFeedback,
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
        <div className="w-[50%] flex flex-col gap-0 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 border-r border-teal-100 overflow-hidden">
          {/* Đề bài section - Flex-none ensures it only takes needed space up to a max */}
          <div className="flex-none p-5 space-y-3 shrink-0 max-h-[40%] overflow-y-auto">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center shadow-sm">
                <FileText className="h-4 w-4 text-teal-600" />
              </div>
              <span className="text-sm font-bold text-teal-800">
                Đề bài {writingPrompt ? `— Task ${writingPrompt.taskType}` : ''}
              </span>
            </div>

            <div className="rounded-xl bg-white border border-teal-100 p-4 shadow-sm">
              {writingPrompt ? (
                <div
                  className="text-[14px] text-gray-800 leading-relaxed prose prose-sm max-w-none"
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
                  className="group relative rounded-xl overflow-hidden border border-teal-100 cursor-zoom-in hover:border-teal-300 transition-all shadow-sm bg-white mt-3"
                  onClick={() => setChartZoomOpen(true)}
                >
                  <Image
                    src={writingPrompt.chartImageUrl}
                    alt="Biểu đồ đề bài"
                    width={500}
                    height={320}
                    className="w-full object-contain bg-white p-2 max-h-[250px]"
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

          {/* Bài viết section - Takes all remaining space */}
          <div className="flex-1 overflow-y-auto p-5 border-t-2 border-emerald-100/50 space-y-3 bg-white min-h-0 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center shadow-sm">
                  <PenLine className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-emerald-800">Bài viết</span>
              </div>
              <Badge variant="outline" className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border-emerald-200">
                {essayWordCount} từ
              </Badge>
            </div>
            
            <div className="rounded-xl border border-gray-100 p-5 shadow-sm bg-gray-50 flex-1 overflow-y-auto">
              <div
                className="text-[14px] text-gray-700 leading-relaxed font-medium prose prose-sm max-w-none whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: session?.content ?? '<span class="text-gray-400 italic">Không có bài viết...</span>' }}
              />
            </div>
          </div>
        </div>
      ) : isReadOnly ? (
        <div className="w-1/2 flex flex-col bg-gradient-to-br from-slate-50 to-gray-100 border-r border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/80 bg-white/60 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">Phiên đã kết thúc</span>
            </div>
            <h2 className="text-[18px] font-bold text-gray-900 mt-1.5">Bản ghi phiên #{sessionId}</h2>
            {session?.userDisplayName && (
              <p className="text-[12.5px] text-gray-500 mt-0.5">Học viên: <span className="font-semibold text-gray-700">{session.userDisplayName}</span></p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {session?.recordingUrl ? (
              <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center text-[13px]">🎙️</span>
                  <div>
                    <p className="text-[12.5px] font-bold text-gray-800">Bản ghi của học viên</p>
                    <p className="text-[10.5px] text-gray-500">Phần trả lời ghi âm trong cuộc gọi</p>
                  </div>
                </div>
                <audio controls src={session.recordingUrl} className="w-full" />
              </div>
            ) : null}
            {session?.expertRecordingUrl ? (
              <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center text-[13px]">🎧</span>
                  <div>
                    <p className="text-[12.5px] font-bold text-gray-800">Bản ghi của giảng viên</p>
                    <p className="text-[10.5px] text-gray-500">Lời nói và phản hồi của bạn</p>
                  </div>
                </div>
                <audio controls src={session.expertRecordingUrl} className="w-full" />
              </div>
            ) : null}
            {!session?.recordingUrl && !session?.expertRecordingUrl && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                <div className="h-16 w-16 rounded-2xl bg-gray-200/60 flex items-center justify-center mb-4">
                  <FileText className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-[13.5px] font-semibold text-gray-600">Không có bản ghi</p>
                <p className="text-[11.5px] text-gray-400 mt-1 max-w-xs">Phiên này không có bản ghi âm. Xem chi tiết đánh giá ở bên phải.</p>
              </div>
            )}
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

      {/* Right panel: Evaluation form */}
      <div className={`${skill === 'WRITING' ? 'w-[50%]' : 'w-1/2'} flex flex-col bg-white overflow-hidden shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)]`}>
        {/* Header */}
        <div className="px-5 py-4 border-b bg-white border-gray-100 shrink-0 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-gray-800 tracking-tight flex items-center gap-2">
            Bảng chấm điểm
            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded flex gap-1">
              Phiên <span className="text-gray-800">#{sessionId}</span>
            </Badge>
          </h2>
          <Badge className={`text-[10px] px-2 py-0.5 tracking-wider uppercase ${skill === 'WRITING' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#ea580c] hover:bg-[#c2410c]'} font-bold border-0 shadow-sm rounded`}>
            {skill}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent space-y-4">
          {/* Grouped Questions Accordion - ONLY FOR SPEAKING */}
          {skill !== 'WRITING' && Object.keys(questionsByPart).length > 0 && (
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
                        Part {part}
                      </h4>
                      <ol className="space-y-2 list-outside ml-4">
                        {qs.map((q) => (
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
          
          <div className="space-y-4">
            {criteria.map((c) => (
              <div key={c.key} className="flex flex-col gap-3 p-4 rounded-xl bg-gray-50/60 border border-gray-100 hover:border-emerald-200 transition-colors shadow-sm">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] font-bold text-gray-800 truncate mr-3">{c.label}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0} max={9} step={0.5}
                      value={scores[c.key] ?? ''}
                      onChange={(e) => setScores((prev) => ({ ...prev, [c.key]: e.target.value }))}
                      disabled={isReadOnly}
                      className="w-20 h-9 font-bold text-center text-emerald-700 bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-100 disabled:cursor-default"
                      placeholder="0.0"
                    />
                  </div>
                </div>
                <textarea
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[12.5px] leading-relaxed min-h-[70px] resize-y focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-default"
                  placeholder={`Nhận xét chi tiết cho ${c.label}...`}
                  value={criteriaFeedback[c.key] ?? ''}
                  onChange={(e) => setCriteriaFeedback((prev) => ({ ...prev, [c.key]: e.target.value }))}
                  disabled={isReadOnly}
                />
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
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-[13px] leading-relaxed min-h-[100px] resize-y focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-gray-400 disabled:cursor-default"
              placeholder="Viết nhận xét tổng quan về bài làm của học viên để giúp họ định hướng rõ ràng nhất..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="text-[16px]">✨</span> Điểm mạnh
              </Label>
              <textarea
                className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-4 py-3 text-[13px] leading-relaxed min-h-[80px] resize-y focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-emerald-700/40 disabled:cursor-default"
                placeholder="Điều học viên đã làm rất tốt..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-orange-700 flex items-center gap-1.5">
                <span className="text-[16px]">💡</span> Cần cải thiện
              </Label>
              <textarea
                className="w-full rounded-xl border border-orange-100 bg-orange-50/30 px-4 py-3 text-[13px] leading-relaxed min-h-[80px] resize-y focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-orange-700/40 disabled:cursor-default"
                placeholder="Những mặt học viên cần chú ý khắc phục..."
                value={areasForImprovement}
                onChange={(e) => setAreasForImprovement(e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </Card>

        {isReadOnly ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 mb-8">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Send className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-800">
                {existingEvaluation ? 'Đánh giá đã được gửi' : 'Phiên đã kết thúc'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {existingEvaluation
                  ? `Chế độ xem — không thể chỉnh sửa. Điểm tổng: ${existingEvaluation.overallScore?.toFixed(1) ?? '—'}`
                  : 'Không có đánh giá nào được lưu cho phiên này.'}
              </p>
            </div>
          </div>
        ) : (
          <Button className="w-full h-12 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-[14px] shadow-sm tracking-wide gap-2 mb-8" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Hệ thống đang lưu đánh giá...</>
            ) : (
              <><Send className="h-4 w-4" /> Gửi kết quả chấm điểm</>
            )}
          </Button>
        )}
        </div>
      </div>
    </div>
  );
}
