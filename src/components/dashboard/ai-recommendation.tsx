'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/user-store';
import { calculateOverallScore } from '@/lib/calendar-utils';
import { getAiRecommendation, type AiRecommendation } from '@/lib/placement-api';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { SkillKey } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  TrendingUp,
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  ArrowRight,
  Lightbulb,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';

const SKILL_META: Record<SkillKey, { label: string; icon: typeof BookOpen }> = {
  reading: { label: 'Reading', icon: BookOpen },
  listening: { label: 'Listening', icon: Headphones },
  writing: { label: 'Writing', icon: PenLine },
  speaking: { label: 'Speaking', icon: Mic },
};

const SKILLS: SkillKey[] = ['reading', 'listening', 'writing', 'speaking'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Split analysis into bullet points (one per non-empty line)
function splitToBullets(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
    .filter(Boolean);
}

export function AiRecommendationDialog({ open, onOpenChange }: Props) {
  const placementResult = useUserStore((s) => s.placementResult);
  const targetScores = useUserStore((s) => s.targetScores);
  const examDate = useUserStore((s) => s.examDate);
  const setTargetScore = useUserStore((s) => s.setTargetScore);

  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleGetRecommendation = async () => {
    if (!placementResult) return;
    setLoading(true);
    setApplied(false);
    try {
      const overallTarget = calculateOverallScore(targetScores) || 0;
      const result = await getAiRecommendation({
        currentReading: placementResult.readingBand,
        currentListening: placementResult.listeningBand,
        currentWriting: placementResult.writingBand,
        currentSpeaking: placementResult.speakingBand,
        currentOverall: placementResult.overallBand,
        targetReading: targetScores.reading,
        targetListening: targetScores.listening,
        targetWriting: targetScores.writing,
        targetSpeaking: targetScores.speaking,
        targetOverall: overallTarget,
        examDate,
      });
      setRecommendation(result);
    } catch {
      toast.error('Không thể lấy gợi ý từ AI. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!recommendation) return;
    const map: Record<SkillKey, number> = {
      reading: recommendation.recommendedReading,
      listening: recommendation.recommendedListening,
      writing: recommendation.recommendedWriting,
      speaking: recommendation.recommendedSpeaking,
    };
    for (const [skill, val] of Object.entries(map)) {
      if (val > 0) setTargetScore(skill as SkillKey, val);
    }
    try {
      await apiClient.put<ApiResponse<unknown>>('/users/me', {
        targetReading: recommendation.recommendedReading,
        targetListening: recommendation.recommendedListening,
        targetWriting: recommendation.recommendedWriting,
        targetSpeaking: recommendation.recommendedSpeaking,
        targetBand: recommendation.recommendedOverall,
      }, true);
      window.dispatchEvent(new Event('roadmap-updated'));
    } catch {
      toast.error('Không thể cập nhật mục tiêu. Vui lòng tải lại trang.');
    }

    setApplied(true);
    toast.success('Đã áp dụng mục tiêu gợi ý!');
    onOpenChange(false);
  };

  // Auto-fetch when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !recommendation && !loading && placementResult) {
      handleGetRecommendation();
    }
  };

  const analysisBullets = recommendation ? splitToBullets(recommendation.analysis) : [];
  const studyBullets = recommendation?.studyPlan ? splitToBullets(recommendation.studyPlan) : [];

  return (
    <>
      <ChibiAnimationStyles />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {/*
          Layout: flex-col + max-h-[85vh]. Header sticky trong dialog (icon + title gọn,
          không còn block xanh cao 150px) → khi nội dung dài, body scroll bên trong dialog
          thay vì dialog tự cao và bị đè bởi header trang. Footer (Apply/Để sau) cũng sticky
          dưới đáy dialog để user luôn thấy CTA mà không phải scroll xuống.
        */}
        <DialogContent className="max-w-2xl p-0 border-0 rounded-3xl shadow-2xl overflow-hidden bg-white max-h-[85vh] flex flex-col gap-0">
          <VisuallyHidden><DialogTitle>Gợi ý từ AI</DialogTitle></VisuallyHidden>

          {/* Sticky compact header */}
          <div className="shrink-0 border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 bg-white">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200/60">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-extrabold text-gray-900 truncate">Gợi ý mục tiêu cá nhân hoá</h2>
                <span className="hidden sm:inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                  AI Coach
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">Moni phân tích trình độ và đề xuất mục tiêu thực tế</p>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                <p className="text-sm font-medium text-gray-600">Moni đang phân tích kết quả của bạn...</p>
              </div>
            )}

            {!loading && !recommendation && (
              <div className="flex flex-col items-center gap-3 py-8">
                <ChibiMascot mood="thinking" size={64} />
                <p className="text-sm text-gray-600">Bấm để bắt đầu phân tích</p>
                <button
                  onClick={handleGetRecommendation}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-md shadow-emerald-500/30 hover:shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  Nhận gợi ý
                </button>
              </div>
            )}

            {!loading && recommendation && (
              <div className="space-y-4">
                {/* Analysis card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900">Phân tích trình độ</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysisBullets.map((line, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
                        <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended scores */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Target className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h3 className="text-sm font-extrabold text-gray-900">Mục tiêu đề xuất</h3>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full">
                      <span className="text-[11px] font-semibold text-emerald-700">Overall</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        {recommendation.recommendedOverall > 0 ? recommendation.recommendedOverall.toFixed(1) : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {SKILLS.map((skill) => {
                      const meta = SKILL_META[skill];
                      const Icon = meta.icon;
                      const recKey = `recommended${skill.charAt(0).toUpperCase() + skill.slice(1)}` as keyof AiRecommendation;
                      const recommended = recommendation[recKey] as number;
                      const current = targetScores[skill];
                      const changed = recommended !== current && recommended > 0 && current > 0;
                      const lower = changed && recommended < current;
                      const higher = changed && recommended > current;

                      return (
                        <div
                          key={skill}
                          className={`relative rounded-2xl border p-3 transition-all ${
                            changed
                              ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
                              : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${changed ? 'bg-emerald-500 text-white' : 'bg-white text-gray-500'}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-gray-700">{meta.label}</span>
                            {higher && (
                              <span className="ml-auto inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                                Cao hơn
                              </span>
                            )}
                            {lower && (
                              <span className="ml-auto text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                                Hạ
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {current > 0 && (
                              <>
                                <span className={`text-base font-bold ${changed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                  {current.toFixed(1)}
                                </span>
                                {changed && <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />}
                              </>
                            )}
                            <span className={`text-2xl font-extrabold ${changed ? 'text-emerald-600' : current > 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                              {recommended > 0 ? recommended.toFixed(1) : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Study plan */}
                {studyBullets.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-200 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-amber-700" />
                      </div>
                      <h3 className="text-sm font-extrabold text-amber-900">Lộ trình học gợi ý</h3>
                    </div>
                    <ul className="space-y-2">
                      {studyBullets.map((line, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-amber-900 leading-relaxed">
                          <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky footer — chỉ hiện khi đã có recommendation */}
          {!loading && recommendation && (
            <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-3 flex gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Để sau
              </button>
              <button
                onClick={handleApply}
                disabled={applied}
                className={`flex-[2] py-3 rounded-2xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                  applied
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 hover:shadow-lg hover:from-emerald-600 hover:to-teal-600'
                }`}
              >
                {applied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Đã áp dụng
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Áp dụng mục tiêu này
                  </>
                )}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
