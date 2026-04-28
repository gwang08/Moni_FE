'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { calculateOverallScore } from '@/lib/calendar-utils';
import { generatePlacement, resetPlacement } from '@/lib/placement-api';
import { useTourStore } from '@/store/tour-store';
import { apiClient } from '@/lib/api-client';
import { getRoadmapInsights } from '@/lib/roadmap-api';
import type { ApiResponse } from '@/types/auth.types';
import type { SkillKey } from '@/types';
import { Pencil, Check, X, RotateCcw, Sparkles, CheckCircle2, Circle, Target, BarChart3, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { PlacementGenerateLoading } from '@/components/placement/placement-generate-loading';
import { AiRecommendationDialog } from '@/components/dashboard/ai-recommendation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';

const SKILL_LABELS: Record<SkillKey, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
};

// Unified green theme — all skills use emerald with gray tracks
const SKILL_THEME: Record<SkillKey, { ring: string; track: string; text: string; bg: string }> = {
  reading:   { ring: '#10b981', track: '#e5e7eb', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  listening: { ring: '#10b981', track: '#e5e7eb', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  writing:   { ring: '#10b981', track: '#e5e7eb', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  speaking:  { ring: '#10b981', track: '#e5e7eb', text: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const SKILLS: SkillKey[] = ['reading', 'listening', 'writing', 'speaking'];

const RING_RADIUS = 34;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

// Render SVG progress ring for 1 skill
function SkillRing({ skill, value, target }: { skill: SkillKey; value: number; target: number }) {
  const theme = SKILL_THEME[skill];
  const hasValue = value > 0;
  const pct = target > 0 && hasValue ? Math.min(value / 9, 1) : 0;
  const dashOffset = RING_CIRC * (1 - pct);

  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto mb-2">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={RING_RADIUS} stroke={theme.track} strokeWidth="8" fill="none" />
          <circle
            cx="40" cy="40" r={RING_RADIUS}
            stroke={theme.ring} strokeWidth="8" fill="none"
            strokeDasharray={RING_CIRC}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-gray-900">
            {hasValue ? value.toFixed(1) : '—'}
          </span>
        </div>
      </div>
      <div className={`font-bold text-xs ${theme.text}`}>{SKILL_LABELS[skill]}</div>
    </div>
  );
}

export function TargetScores() {
  const router = useRouter();
  const targetScores = useUserStore((s) => s.targetScores);
  const setTargetScore = useUserStore((s) => s.setTargetScore);
  const placementResult = useUserStore((s) => s.placementResult);
  const clearPlacementResult = useUserStore((s) => s.clearPlacementResult);

  const { step: tourStep, nextStep } = useTourStore();
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [draft, setDraft] = useState<Record<SkillKey, string>>({
    reading: '', listening: '', writing: '', speaking: '',
  });

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
    const overall = calculateOverallScore(newScores);

    try {
      await apiClient.put<ApiResponse<unknown>>('/users/me', {
        targetReading: newScores.reading,
        targetListening: newScores.listening,
        targetWriting: newScores.writing,
        targetSpeaking: newScores.speaking,
        targetBand: overall,
      }, true);

      const insights = await getRoadmapInsights().catch(() => null);
      if (insights?.targetOverAmbitious) {
        toast.warning(insights.targetWarning || 'Muc tieu co the hoi qua tam so voi thoi gian con lai.');
      }

      window.dispatchEvent(new Event('roadmap-updated'));
      if (tourStep === 1) nextStep();
    } catch { /* keep UI responsive */ }
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
      const pair = await generatePlacement();
      sessionStorage.setItem('pending-placement-test', JSON.stringify(pair));
      router.push('/placement');
    } catch {
      toast.error('Không thể đặt lại trình độ. Vui lòng thử lại.');
    } finally {
      setResetting(false);
    }
  };

  // examDate is OPTIONAL — AI can analyze on band gap alone
  const allReady = hasScores && !!placementResult;

  const handleAiClick = () => {
    if (allReady) setShowAiDialog(true);
    else setShowMissingDialog(true);
  };

  // Auto-open AI recommendation dialog ONCE right after user completes placement test.
  // result-step.tsx sets sessionStorage flag with placement id; we consume it here.
  // IMPORTANT: defer opening if a roadmap tour is pending/active so the user sees the
  // intro overlay first and confirms ("Đã hiểu") before the AI dialog appears.
  const aiTriggerFiredRef = useRef(false);
  useEffect(() => {
    if (!placementResult || !hasScores) return;
    if (aiTriggerFiredRef.current) return;

    const tryFire = () => {
      if (aiTriggerFiredRef.current) return;
      // Wait while tour is active or about to start
      if (useTourStore.getState().step > 0) return;
      if (typeof window !== 'undefined' && sessionStorage.getItem('showRoadmapTour')) return;

      const triggerId = sessionStorage.getItem('triggerAiRecommendation');
      if (!triggerId || Number(triggerId) !== placementResult.id) return;

      sessionStorage.removeItem('triggerAiRecommendation');
      aiTriggerFiredRef.current = true;
      setShowAiDialog(true);
    };

    tryFire();
    // Re-attempt after the dashboard finishes the post-placement tour
    window.addEventListener('roadmap-tour-completed', tryFire);
    return () => window.removeEventListener('roadmap-tour-completed', tryFire);
  }, [placementResult, hasScores, tourStep]);

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
    if (diff <= 0) return 'text-emerald-600';
    if (diff <= 1.0) return 'text-amber-600';
    return 'text-gray-500';
  };

  return (
    <div className={`bg-white h-full relative transition-all duration-300 ${tourStep === 1 || tourStep === 3 ? 'z-50 ring-4 ring-emerald-400 shadow-2xl rounded-3xl' : 'rounded-3xl shadow-sm'}`}>
      {tourStep === 1 && (
        <div className="absolute top-1/2 -translate-y-1/2 -right-6 translate-x-full w-64 bg-white p-4 rounded-2xl shadow-xl border border-emerald-100 z-50 animate-in fade-in slide-in-from-left-4">
          <div className="flex gap-3 mb-2">
            <ChibiMascot mood="excited" size={40} />
            <div className="font-bold text-gray-800 text-sm">Bước 1/3</div>
          </div>
          <p className="text-sm text-gray-600">Hãy bắt đầu bằng cách nhập mục tiêu điểm số từng kỹ năng của bạn nhé. Nhấn vào cây bút để chỉnh sửa!</p>
        </div>
      )}
      {tourStep === 3 && (
        <div className="absolute top-3/4 -translate-y-1/2 -right-6 translate-x-full w-64 bg-white p-4 rounded-2xl shadow-xl border border-emerald-100 z-50 animate-in fade-in slide-in-from-left-4">
          <div className="flex gap-3 mb-2">
            <ChibiMascot mood="excited" size={40} />
            <div className="font-bold text-gray-800 text-sm">Bước 3/3</div>
          </div>
          <p className="text-sm text-gray-600">Bắt đầu thôi! Hãy làm nhanh bài test Đánh giá năng lực để Moni có dữ liệu xếp lộ trình cho bạn nhé!</p>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Mục tiêu 4 kỹ năng</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {overallScore !== null ? <>Overall mục tiêu: <b className="text-emerald-600">{overallScore.toFixed(1)}</b></> : 'Từng bước nhỏ, tiến bộ lớn'}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {!editing ? (
              <>
                <button
                  onClick={startEdit}
                  className="p-2 rounded-full hover:bg-emerald-50 text-gray-400 hover:text-emerald-500 transition-colors"
                  title="Chỉnh sửa mục tiêu"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={saveEdit} className="p-2 rounded-full hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-500 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress rings */}
        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            {SKILLS.map((skill) => {
              const theme = SKILL_THEME[skill];
              return (
                <div key={skill} className={`rounded-2xl ${theme.bg} p-3`}>
                  <p className={`text-xs font-bold mb-1 ${theme.text}`}>{SKILL_LABELS[skill]}</p>
                  <input
                    type="number" min="0" max="9" step="0.5"
                    value={draft[skill]}
                    onChange={(e) => setDraft((d) => ({ ...d, [skill]: e.target.value }))}
                    placeholder="0–9"
                    className="w-full text-lg font-extrabold bg-white rounded-xl px-3 py-1.5 border-0 outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {SKILLS.map((skill) => (
              <SkillRing key={skill} skill={skill} value={targetScores[skill]} target={targetScores[skill]} />
            ))}
          </div>
        )}

        {/* Placement result section */}
        <div className="mt-5 pt-5 border-t border-dashed border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              Trình độ hiện tại
            </h4>
            {false && placementResult && (
              <button
                onClick={handleReset}
                disabled={resetting}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
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
            <div className="flex flex-col gap-2">
              <PlacementGenerateLoading open={generating} />
              {(tourStep > 0 && tourStep < 3) ? (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-2xl italic">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Đang trong quá trình thiết lập lộ trình...</span>
                </div>
              ) : (!hasScores && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Thiết lập <b>Mục tiêu điểm số</b> để mở khoá bài Đánh giá.</span>
                </div>
              ))}
              <button
                onClick={handleStartTest}
                disabled={generating || (tourStep > 0 ? tourStep !== 3 : !hasScores)}
                className={`w-full text-center text-sm font-bold py-2.5 rounded-2xl transition-colors ${
                  (tourStep > 0 ? tourStep !== 3 : !hasScores)
                    ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'text-white bg-gradient-to-r from-emerald-500 to-gray-500 hover:shadow-lg hover:shadow-emerald-500/30'
                } disabled:opacity-50`}
              >
                Bắt đầu đánh giá →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {SKILLS.map((skill) => {
                const current = getCurrentBand(skill);
                const target = targetScores[skill];
                const compClass = current !== null && target > 0
                  ? getBandComparisonClass(current, target)
                  : 'text-gray-600';
                return (
                  <div key={skill} className="flex items-center justify-between bg-gray-50 rounded-2xl px-3 py-2">
                    <span className="text-xs text-gray-500 font-medium">{SKILL_LABELS[skill]}</span>
                    <span className={`text-sm font-extrabold ${compClass}`}>
                      {current !== null ? current.toFixed(1) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Missing prerequisites dialog — kept original content, tweaked theme */}
        <ChibiAnimationStyles />
        <Dialog open={showMissingDialog} onOpenChange={setShowMissingDialog}>
          <DialogContent className="max-w-sm p-0 overflow-hidden border-0 rounded-3xl shadow-2xl" showCloseButton={false}>
            <VisuallyHidden><DialogTitle>Chuẩn bị nhận gợi ý từ AI</DialogTitle></VisuallyHidden>
            <div className="bg-gradient-to-b from-emerald-50 via-emerald-50/50 to-white pt-6 pb-2 px-6">
              <ChibiMascot mood="thinking" size={72} />
              <div className="text-center space-y-1.5">
                <h2 className="text-lg font-extrabold text-gray-800">Chuẩn bị nhận gợi ý</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Hoàn thành các bước sau để Moni gợi ý mục tiêu phù hợp nhé!
                </p>
              </div>
            </div>

            <div className="px-6 pb-5 pt-3 space-y-3">
              {[
                { done: hasScores, label: 'Nhập mục tiêu band điểm', action: () => { setShowMissingDialog(false); startEdit(); } },
                { done: !!placementResult, label: 'Làm bài đánh giá trình độ', action: () => { setShowMissingDialog(false); handleStartTest(); } },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  {step.done
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    : <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                  }
                  <span className={`text-sm flex-1 ${step.done ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>{step.label}</span>
                  {!step.done && (
                    <button
                      onClick={step.action}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors shrink-0"
                    >
                      Làm ngay
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setShowMissingDialog(false)}
                className="w-full mt-2 rounded-2xl h-11 text-sm font-extrabold shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-emerald-500 to-gray-500 text-white"
              >
                Đã hiểu
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <AiRecommendationDialog open={showAiDialog} onOpenChange={setShowAiDialog} />
      </div>
    </div>
  );
}
