'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/user-store';
import { calculateOverallScore } from '@/lib/calendar-utils';
import { getAiRecommendation, type AiRecommendation } from '@/lib/placement-api';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { SkillKey } from '@/types';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SKILL_LABELS: Record<SkillKey, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
};

export function AiRecommendation() {
  const placementResult = useUserStore((s) => s.placementResult);
  const targetScores = useUserStore((s) => s.targetScores);
  const examDate = useUserStore((s) => s.examDate);
  const setTargetScore = useUserStore((s) => s.setTargetScore);

  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const canRequest = !!placementResult;

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

  const handleApply = () => {
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
    // Sync to backend
    apiClient.put<ApiResponse<unknown>>('/users/me', {
      targetReading: recommendation.recommendedReading,
      targetListening: recommendation.recommendedListening,
      targetWriting: recommendation.recommendedWriting,
      targetSpeaking: recommendation.recommendedSpeaking,
      targetBand: recommendation.recommendedOverall,
    }, true).catch(() => {});
    setApplied(true);
    toast.success('Đã áp dụng mục tiêu gợi ý!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-100 rounded-lg">
            <Sparkles className="h-4 w-4 text-violet-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">Gợi ý từ AI</h3>
        </div>
        <button
          onClick={handleGetRecommendation}
          disabled={!canRequest || loading}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Đang phân tích...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              {recommendation ? 'Phân tích lại' : 'Nhận gợi ý'}
            </>
          )}
        </button>
      </div>

      {!canRequest && (
        <p className="text-sm text-gray-400 text-center py-4">
          Làm bài test đánh giá trình độ trước để nhận gợi ý từ AI
        </p>
      )}

      {recommendation && (
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
    </div>
  );
}
