'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { calculateOverallScore } from '@/lib/calendar-utils';
import { generatePlacement, resetPlacement } from '@/lib/placement-api';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { SkillKey } from '@/types';
import { Pencil, Check, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { PlacementGenerateLoading } from '@/components/placement/placement-generate-loading';

const SKILL_LABELS: Record<SkillKey, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
};

const SKILL_COLORS: Record<SkillKey, string> = {
  reading: 'bg-blue-50 border-blue-200 text-blue-700',
  listening: 'bg-purple-50 border-purple-200 text-purple-700',
  writing: 'bg-green-50 border-green-200 text-green-700',
  speaking: 'bg-pink-50 border-pink-200 text-pink-700',
};

const SKILLS: SkillKey[] = ['reading', 'listening', 'writing', 'speaking'];

export function TargetScores() {
  const router = useRouter();
  const targetScores = useUserStore((s) => s.targetScores);
  const setTargetScore = useUserStore((s) => s.setTargetScore);
  const placementResult = useUserStore((s) => s.placementResult);
  const clearPlacementResult = useUserStore((s) => s.clearPlacementResult);
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<Record<SkillKey, string>>({
    reading: '',
    listening: '',
    writing: '',
    speaking: '',
  });

  // Compute overall from draft (live) when editing, from store otherwise
  const liveScores = editing
    ? { reading: parseFloat(draft.reading) || 0, listening: parseFloat(draft.listening) || 0, writing: parseFloat(draft.writing) || 0, speaking: parseFloat(draft.speaking) || 0 }
    : targetScores;
  const hasScores = SKILLS.some((k) => liveScores[k] > 0);
  const overallScore = hasScores ? calculateOverallScore(liveScores) : null;

  const startEdit = () => {
    setDraft({
      reading: targetScores.reading ? String(targetScores.reading) : '',
      listening: targetScores.listening ? String(targetScores.listening) : '',
      writing: targetScores.writing ? String(targetScores.writing) : '',
      speaking: targetScores.speaking ? String(targetScores.speaking) : '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    const newScores: Record<SkillKey, number> = { reading: 0, listening: 0, writing: 0, speaking: 0 };
    SKILLS.forEach((skill) => {
      const val = parseFloat(draft[skill]);
      if (!isNaN(val) && val >= 0 && val <= 9) {
        newScores[skill] = val;
        setTargetScore(skill, val);
      } else {
        setTargetScore(skill, 0);
      }
    });
    setEditing(false);
    // Sync to backend (fire & forget)
    const overall = calculateOverallScore(newScores);
    apiClient.put<ApiResponse<unknown>>('/users/me', {
      targetReading: newScores.reading,
      targetListening: newScores.listening,
      targetWriting: newScores.writing,
      targetSpeaking: newScores.speaking,
      targetBand: overall,
    }, true).catch(() => {});
  };

  const cancelEdit = () => setEditing(false);

  const handleStartTest = async () => {
    setGenerating(true);
    try {
      const pair = await generatePlacement();
      sessionStorage.setItem('pending-placement-test', JSON.stringify(pair));
      router.push('/placement');
    } catch {
      toast.error('Không thể tạo bài test. Vui lòng thử lại.');
      setGenerating(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetPlacement();
      clearPlacementResult();
      // After reset, generate new test and go directly
      const pair = await generatePlacement();
      sessionStorage.setItem('pending-placement-test', JSON.stringify(pair));
      router.push('/placement');
    } catch {
      toast.error('Không thể đặt lại trình độ. Vui lòng thử lại.');
    } finally {
      setResetting(false);
    }
  };

  // Get current band for a skill from placement result
  const getCurrentBand = (skill: SkillKey): number | null => {
    if (!placementResult) return null;
    const map: Record<SkillKey, number> = {
      reading: placementResult.readingBand,
      listening: placementResult.listeningBand,
      writing: placementResult.writingBand,
      speaking: placementResult.speakingBand,
    };
    return map[skill];
  };

  const getBandComparisonClass = (current: number, target: number): string => {
    const diff = target - current;
    if (diff <= 0) return 'text-green-600';
    if (diff <= 1.0) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-800">Mục tiêu của bạn</h3>
        {!editing ? (
          <button
            onClick={startEdit}
            className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors"
            title="Chỉnh sửa mục tiêu"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={saveEdit}
              className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Overall Score Badge */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Overall</span>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold text-white">
              {overallScore !== null ? overallScore.toFixed(1) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Skill Boxes */}
      <div className="grid grid-cols-2 gap-3">
        {SKILLS.map((skill) => (
          <div
            key={skill}
            className={`rounded-xl border p-3 ${SKILL_COLORS[skill]}`}
          >
            <p className="text-xs font-medium opacity-70 mb-1">{SKILL_LABELS[skill]}</p>
            {editing ? (
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={draft[skill]}
                onChange={(e) => setDraft((d) => ({ ...d, [skill]: e.target.value }))}
                placeholder="0–9"
                className="w-full text-lg font-bold bg-white/70 rounded-lg px-2 py-0.5 border border-current/20 outline-none focus:ring-1 focus:ring-current"
              />
            ) : (
              <p className="text-xl font-bold">
                {targetScores[skill] > 0 ? targetScores[skill].toFixed(1) : '—'}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Placement result section */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Trình độ hiện tại</h4>
          {placementResult && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Đánh giá lại trình độ"
            >
              {resetting
                ? <span className="h-3.5 w-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                : <RotateCcw className="h-3.5 w-3.5" />
              }
            </button>
          )}
        </div>

        {!placementResult ? (
          <>
            <PlacementGenerateLoading open={generating} />
            <button
              onClick={handleStartTest}
              disabled={generating}
              className="w-full text-center text-sm text-orange-500 hover:text-orange-600 font-medium py-2 border border-dashed border-orange-300 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
            >
              Chưa đánh giá — Bắt đầu ngay
            </button>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {SKILLS.map((skill) => {
              const current = getCurrentBand(skill);
              const target = targetScores[skill];
              const compClass = current !== null && target > 0
                ? getBandComparisonClass(current, target)
                : 'text-gray-600';
              return (
                <div key={skill} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
                  <span className="text-xs text-gray-500">{SKILL_LABELS[skill]}</span>
                  <span className={`text-sm font-semibold ${compClass}`}>
                    {current !== null ? current.toFixed(1) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
