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
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';

const SKILL_LABELS: Record<SkillKey, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    // Update user profile targets
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

  // Auto-fetch when dialog opens and no recommendation yet
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !recommendation && !loading && placementResult) {
      handleGetRecommendation();
    }
  };

  return (
    <>
      <ChibiAnimationStyles />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
          <VisuallyHidden><DialogTitle>Gợi ý từ AI</DialogTitle></VisuallyHidden>

          <div className="bg-gradient-to-b from-violet-50 via-violet-50/50 to-white pt-6 pb-2 px-6">
            <ChibiMascot mood="thinking" size={72} />
            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-bold text-gray-800">Gợi ý từ AI</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Moni phân tích trình độ và đề xuất mục tiêu phù hợp cho bạn
              </p>
            </div>
          </div>

          <div className="px-6 pb-5 pt-3">
            {loading && (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p className="text-sm text-gray-500">Đang phân tích...</p>
              </div>
            )}

            {!loading && recommendation && (
              <div className="space-y-4">
                {/* Analysis */}
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {recommendation.analysis}
                  </p>
                </div>

                {/* Recommended scores */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Mục tiêu gợi ý</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['reading', 'listening', 'writing', 'speaking'] as SkillKey[]).map((skill) => {
                      const recKey = `recommended${skill.charAt(0).toUpperCase() + skill.slice(1)}` as keyof AiRecommendation;
                      const recommended = recommendation[recKey] as number;
                      const current = targetScores[skill];
                      const changed = recommended !== current && recommended > 0;
                      return (
                        <div
                          key={skill}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 ${changed ? 'bg-violet-50 border border-violet-200' : 'bg-gray-50'}`}
                        >
                          <span className="text-xs text-gray-500">{SKILL_LABELS[skill]}</span>
                          <div className="flex items-center gap-1.5">
                            {changed && current > 0 && (
                              <span className="text-xs text-gray-400 line-through">{current.toFixed(1)}</span>
                            )}
                            <span className={`text-sm font-semibold ${changed ? 'text-violet-600' : 'text-gray-600'}`}>
                              {recommended > 0 ? recommended.toFixed(1) : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center mt-2 gap-1.5">
                    <span className="text-xs text-gray-500">Overall:</span>
                    <span className="text-sm font-bold text-violet-600">
                      {recommendation.recommendedOverall > 0 ? recommendation.recommendedOverall.toFixed(1) : '—'}
                    </span>
                  </div>
                </div>

                {/* Study plan */}
                {recommendation.studyPlan && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-medium text-amber-700 mb-1">Lộ trình học</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {recommendation.studyPlan}
                    </p>
                  </div>
                )}

                {/* Apply button */}
                <button
                  onClick={handleApply}
                  disabled={applied}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    applied
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600'
                  }`}
                >
                  {applied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Đã áp dụng
                    </>
                  ) : (
                    'Áp dụng mục tiêu gợi ý'
                  )}
                </button>
              </div>
            )}

            {!loading && !recommendation && (
              <div className="text-center py-4">
                <button
                  onClick={handleGetRecommendation}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 transition-all flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  Nhận gợi ý
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
