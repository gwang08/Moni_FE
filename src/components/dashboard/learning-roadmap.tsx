'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Check, Clock, Lock, TrendingUp, TrendingDown, Minus, Trophy,
  Sparkles, ArrowRight,
} from 'lucide-react';
import { getWeeklyPlan } from '@/lib/roadmap-api';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { WeeklyPlanResponse, DailySlotResponse, RoadmapSkill, PerformanceVerdict } from '@/types/roadmap.types';

function formatStimulusTitle(title: string | null | undefined, skill: RoadmapSkill, isAssessment: boolean) {
  if (!title) return isAssessment ? 'Bài đánh giá kỹ năng' : 'Bài luyện tập';
  
  let formattedTitle = title;
  
  if (skill === 'LISTENING') formattedTitle = formattedTitle.replace(/^Passage\s+/i, 'Section ');
  else if (skill === 'WRITING') formattedTitle = formattedTitle.replace(/^Passage\s+/i, 'Task ');
  else if (skill === 'SPEAKING') formattedTitle = formattedTitle.replace(/^Passage\s+/i, 'Part ');

  return formattedTitle;
}

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const SKILL_STYLE: Record<RoadmapSkill, { bg: string; text: string; border: string; dot: string }> = {
  READING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  LISTENING: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  WRITING: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  SPEAKING: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
};

const VERDICT_CONFIG: Record<PerformanceVerdict, { icon: typeof TrendingUp; label: string; color: string }> = {
  IMPROVED: { icon: TrendingUp, label: 'Tiến bộ', color: 'text-green-600' },
  STABLE: { icon: Minus, label: 'Ổn định', color: 'text-amber-600' },
  DECLINED: { icon: TrendingDown, label: 'Cần cải thiện', color: 'text-red-500' },
};

function DifficultyBar({ level }: { level: number }) {
  const filled = Math.round(level * 5);
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-gray-400 mr-1">Độ khó</span>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-3 rounded-sm transition-colors ${
            i < filled ? 'bg-gradient-to-r from-orange-400 to-rose-400' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function SlotCard({ slot, onClick, locked }: { slot: DailySlotResponse; onClick: () => void; locked: boolean }) {
  const style = SKILL_STYLE[slot.skill];
  const isDone = slot.status === 'DONE';
  const isAssessment = slot.taskType === 'ASSESSMENT';
  const hasLink = slot.testId != null || slot.stimulusId != null;
  const isDisabled = locked || (!hasLink && !isDone);

  const formattedTitle = formatStimulusTitle(slot.stimulusTitle, slot.skill, isAssessment);

  return (
    <div className="relative group/slot">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
          isDone
            ? `${style.bg} ${style.border} opacity-90`
            : locked
              ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
              : hasLink
                ? `bg-white border-gray-200 hover:${style.border} hover:shadow-sm cursor-pointer`
                : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isDone ? 'bg-green-500' : locked ? 'bg-gray-300' : style.dot}`} />
          <span className={`text-xs font-semibold ${isDone ? 'text-green-700' : locked ? 'text-gray-400' : style.text}`}>
            {slot.skill}
          </span>
          {isAssessment && (
            <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
              Đánh giá
            </span>
          )}
          {locked && !isDone && <Lock className="h-3 w-3 text-gray-300 ml-auto flex-shrink-0" />}
          {isDone && <Check className="h-3.5 w-3.5 text-green-600 ml-auto flex-shrink-0" />}
        </div>
        <p className={`text-[11px] mt-1 truncate ${locked && !isDone ? 'text-gray-300' : 'text-gray-500'}`}>
          {formattedTitle}
        </p>
        {isDone && slot.score != null && slot.totalQuestions != null && (
          <p className="text-[10px] font-mono text-green-700 mt-0.5">
            {slot.score}/{slot.totalQuestions}
          </p>
        )}
      </button>

      {/* Hover Popup */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] w-[max-content] max-w-[220px] bg-gray-900/95 backdrop-blur-sm text-white text-[11px] sm:text-xs rounded-lg py-2 px-3 opacity-0 invisible group-hover/slot:opacity-100 group-hover/slot:visible transition-all duration-200 z-[60] shadow-xl pointer-events-none border border-gray-800">
        <div className="font-medium whitespace-pre-wrap leading-snug">{formattedTitle}</div>
        <div className="absolute w-2 h-2 bg-gray-900/95 rotate-45 left-1/2 -translate-x-1/2 -bottom-1 border-b border-r border-gray-800"></div>
      </div>
    </div>
  );
}

export function LearningRoadmap() {
  const router = useRouter();
  const [plan, setPlan] = useState<WeeklyPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<DailySlotResponse | null>(null);
  const fetchedRef = useRef(false);

  const fetchPlan = async () => {
    try {
      const data = await getWeeklyPlan();
      setPlan(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchPlan();
  }, []);

  useEffect(() => {
    const handler = () => fetchPlan();
    window.addEventListener('roadmap-updated', handler);
    return () => window.removeEventListener('roadmap-updated', handler);
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const slotsByDay = useMemo(() => {
    if (!plan) return new Map<number, DailySlotResponse[]>();
    const map = new Map<number, DailySlotResponse[]>();
    for (const slot of plan.slots) {
      const list = map.get(slot.dayOfWeek) ?? [];
      list.push(slot);
      map.set(slot.dayOfWeek, list);
    }
    return map;
  }, [plan]);

  if (loading) return <SkeletonCard className="h-72" />;

  if (!plan) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-800">Lộ trình học tập</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="h-6 w-6 text-orange-400" />
          </div>
          <p className="text-sm text-gray-500">
            Làm bài đánh giá trình độ để nhận lộ trình học tập phù hợp nhé!
          </p>
        </div>
      </div>
    );
  }

  const handleSlotClick = (slot: DailySlotResponse) => {
    if (slot.status === 'DONE') return;

    const id = slot.testId ?? slot.stimulusId;
    if (!id) return;

    setActiveSlot(slot);
    setConfirmOpen(true);
  };

  const handleConfirmPractice = () => {
    if (!activeSlot) return;
    
    const id = activeSlot.testId ?? activeSlot.stimulusId;
    if (!id) return;

    // Route based on skill type
    switch (activeSlot.skill) {
      case 'SPEAKING':
        if (activeSlot.stimulusId) {
          router.push(`/speaking-exam/${activeSlot.stimulusId}`);
        } else {
          router.push(`/practice/speaking/${id}`);
        }
        break;
      case 'WRITING':
        router.push(`/practice/writing/${id}`);
        break;
      case 'READING':
        router.push(`/practice/reading/${id}`);
        break;
      case 'LISTENING':
        router.push(`/practice/listening/${id}`);
        break;
    }
  };

  const verdict = plan.previousVerdict ? VERDICT_CONFIG[plan.previousVerdict] : null;
  const VerdictIcon = verdict?.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50/50 to-rose-50/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100">
              <BookOpen className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">
                Lộ trình tuần {plan.weekNumber}
                <span className="text-xs font-normal text-gray-400 ml-2">Tháng {plan.monthCycle}</span>
              </h2>
              <p className="text-[11px] text-gray-400">
                {plan.weekStartDate} – {plan.weekEndDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {verdict && VerdictIcon && (
              <div className={`flex items-center gap-1 ${verdict.color}`}>
                <VerdictIcon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{verdict.label}</span>
              </div>
            )}
            <DifficultyBar level={plan.difficultyLevel} />
          </div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {Array.from({ length: 7 }, (_, i) => {
            const dayNum = i + 1;
            const daySlots = slotsByDay.get(dayNum) ?? [];
            // Build label from slot date or plan start date
            const slotDate = daySlots.length > 0 ? daySlots[0].slotDate : null;
            let dayLabel = `N${dayNum}`;
            if (slotDate) {
              const d = new Date(slotDate);
              const wd = WEEKDAY_SHORT[d.getDay()];
              dayLabel = `${wd} ${d.getDate()}/${d.getMonth() + 1}`;
            }
            const isToday = slotDate === today;
            const isFuture = slotDate != null && slotDate > today;
            const allDone = daySlots.length > 0 && daySlots.every(s => s.status === 'DONE');
            const isDay7 = dayNum === 7;

            return (
              <div key={dayNum} className="text-center">
                <div
                  className={`text-[11px] font-semibold mb-2 py-1 rounded-md ${
                    isToday
                      ? 'bg-orange-500 text-white'
                      : allDone
                        ? 'bg-green-100 text-green-700'
                        : isDay7
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-gray-500'
                  }`}
                >
                  {dayLabel}
                </div>
                <div className="space-y-1.5">
                  {daySlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      locked={isFuture}
                      onClick={() => handleSlotClick(slot)}
                    />
                  ))}
                  {daySlots.length === 0 && (
                    <div className="text-[10px] text-gray-300 py-4">—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today Completed Banner */}
      {plan.todayCompleted && plan.suggestVocabulary && (
        <div className="mx-6 mb-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Bạn đã hoàn thành task hôm nay! 🎉</p>
              <p className="text-xs text-emerald-600">Hãy ôn tập từ vựng IELTS để cải thiện thêm</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/vocabulary')}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Học từ vựng <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Monthly Assessment Banner */}
      {plan.monthlyAssessmentPending && (
        <div className="mx-6 mb-4 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-violet-600" />
            <div>
              <p className="text-sm font-semibold text-violet-800">Bài đánh giá tháng {plan.monthCycle} đã sẵn sàng!</p>
              <p className="text-xs text-violet-600">Làm Full Test để đánh giá toàn diện trình độ IELTS</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/full-test')}
            className="flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-100 hover:bg-violet-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Làm bài <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="px-6 pb-4 flex items-center gap-4 flex-wrap">
        {(Object.entries(SKILL_STYLE) as [RoadmapSkill, typeof SKILL_STYLE.READING][]).map(([skill, style]) => (
          <div key={skill} className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${style.dot}`} />
            <span className="text-[10px] text-gray-500">{skill}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5 text-gray-400" />
          <span className="text-[10px] text-gray-400">Tuần {plan.weekInMonth}/4</span>
        </div>
      </div>
      
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Bạn muốn luyện tập luôn chứ?"
        description={activeSlot ? `Bạn đang chuẩn bị mở bài ${formatStimulusTitle(activeSlot.stimulusTitle, activeSlot.skill, activeSlot.taskType === 'ASSESSMENT')} (${activeSlot.skill}).` : undefined}
        confirmText="Ok làm luôn"
        cancelText="Đợi xíu"
        variant="default"
        onConfirm={handleConfirmPractice}
      />
    </div>
  );
}
