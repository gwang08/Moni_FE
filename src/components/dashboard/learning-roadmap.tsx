'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Check, Clock, Lock, TrendingUp, TrendingDown, Minus, Trophy,
  Sparkles, ArrowRight,
} from 'lucide-react';
import { getWeeklyPlan, startVocabLearning, submitVocabLearning } from '@/lib/roadmap-api';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useTourStore } from '@/store/tour-store';
import { ChibiMascot } from '@/components/ui/chibi-mascot';
import type { WeeklyPlanResponse, DailySlotResponse, RoadmapSkill, PerformanceVerdict } from '@/types/roadmap.types';
import type { VocabWord } from '@/types/vocab.types';

function formatStimulusTitle(title: string | null | undefined, skill: RoadmapSkill, isAssessment: boolean, taskType?: string) {
  if (skill === 'VOCABULARY') {
    if (taskType === 'VOCAB_TEST') return 'Kiểm tra từ vựng';
    return title || 'Bài luyện tập';
  }
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
  VOCABULARY: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
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
  const isVocab = slot.skill === 'VOCABULARY';
  const hasLink = slot.testId != null || slot.stimulusId != null || isVocab;
  const isDisabled = locked || (!hasLink && !isDone);

  const formattedTitle = formatStimulusTitle(slot.stimulusTitle, slot.skill, isAssessment, slot.taskType);

  return (
    <div className="relative group/slot">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`w-full rounded-xl border px-2.5 py-2 text-left transition-all relative overflow-hidden ${
          isDone
            ? `${style.bg} ${style.border} opacity-100 shadow-sm`
            : locked
              ? 'bg-gray-50/50 border-gray-100 opacity-60 cursor-not-allowed'
              : hasLink
                ? `bg-white border-gray-200 hover:${style.border} hover:shadow-md cursor-pointer`
                : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1 pr-4">
          <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isDone ? 'bg-green-500' : locked ? 'bg-gray-300' : style.dot}`} />
          <span className={`text-[10px] font-bold tracking-tight uppercase truncate ${isDone ? 'text-green-700' : locked ? 'text-gray-400' : style.text}`}>
            {slot.skill}
          </span>
          {isAssessment && (
            <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-700 px-1 py-0.5 rounded-sm flex-shrink-0">
              Test
            </span>
          )}
        </div>
        
        <p className={`text-[10px] leading-tight truncate ${locked && !isDone ? 'text-gray-300' : 'text-gray-500'}`} title={formattedTitle}>
          {formattedTitle}
        </p>

        {/* Status Icons - Absolutely positioned for perfect alignment */}
        <div className="absolute right-1.5 top-2 flex items-center">
          {locked && !isDone && <Lock className="h-2.5 w-2.5 text-gray-300" />}
          {isDone && <Check className="h-3 w-3 text-green-600" />}
        </div>

        {isDone && slot.score != null && slot.totalQuestions != null && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-green-600 bg-green-100/50 px-1 rounded">
              {slot.score}/{slot.totalQuestions}
            </span>
          </div>
        )}
      </button>

      {/* Hover Popup */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] w-[max-content] max-w-[220px] bg-gray-900/95 backdrop-blur-sm text-white text-[11px] sm:text-xs rounded-lg py-2 px-3 opacity-0 invisible group-hover/slot:opacity-100 group-hover/slot:visible transition-all duration-200 z-[60] shadow-xl pointer-events-none border border-gray-800">
        <div className="font-medium whitespace-pre-wrap leading-snug">
          {formattedTitle}
        </div>
        <div className="absolute w-2 h-2 bg-gray-900/95 rotate-45 left-1/2 -translate-x-1/2 -bottom-1 border-b border-r border-gray-800"></div>
      </div>
    </div>
  );
}

export function LearningRoadmap({ weekNumber }: { weekNumber?: number }) {
  const router = useRouter();
  const { step: tourStep, nextStep, stopTour } = useTourStore();
  const [plan, setPlan] = useState<WeeklyPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<DailySlotResponse | null>(null);
  
  // Vocabulary Flashcard learning states
  const [learnedWords, setLearnedWords] = useState<VocabWord[]>([]);
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [vocabCurrentIdx, setVocabCurrentIdx] = useState(0);
  const [notLearnedIds, setNotLearnedIds] = useState<number[]>([]);
  const [learnedIds, setLearnedIds] = useState<number[]>([]);
  const [vocabSubmitting, setVocabSubmitting] = useState(false);

  const fetchedRef = useRef(false);

  const fetchPlan = async () => {
    try {
      const data = await getWeeklyPlan(weekNumber);
      setPlan(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPlan();
  }, [weekNumber]);

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
      <div id="learning-roadmap-section" className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative transition-all duration-500 ${tourStep >= 5 && tourStep <= 7 ? 'z-50 ring-4 ring-orange-500 shadow-2xl scale-[1.01]' : ''}`}>
        
        {/* Tour Step 5: Intro */}
        {tourStep === 5 && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 -translate-y-full w-80 bg-white p-5 rounded-2xl shadow-xl border border-orange-100 z-50 animate-in fade-in slide-in-from-top-4">
            <div className="flex gap-3 mb-3">
              <ChibiMascot mood="excited" size={48} />
              <div>
                <div className="font-bold text-gray-800">Bước 1/3</div>
                <div className="text-orange-600 text-sm font-semibold">Weekly Plan Cá Nhân Hoá</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Đây là hệ thống Weekly Plan cực kỳ thông minh của Moni. Khối lượng bài tập và kỹ năng được tự động đo ni đóng giày dựa trên bài đánh giá hiện tại của bạn!
            </p>
            <button 
              onClick={nextStep}
              className="w-full bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white py-2 rounded-xl text-sm font-bold shadow-md transition-all"
            >
              Tiếp theo
            </button>
          </div>
        )}

        {/* Tour Step 6: Sat Assessment */}
        {tourStep === 6 && (
          <div className="absolute top-1/3 -right-6 translate-x-full w-80 bg-white p-5 rounded-2xl shadow-xl border border-purple-100 z-50 animate-in fade-in slide-in-from-left-4">
            <div className="flex gap-3 mb-3">
              <ChibiMascot mood="thinking" size={48} />
              <div>
                <div className="font-bold text-gray-800">Bước 2/3</div>
                <div className="text-purple-600 text-sm font-semibold">Weekly Assessment (Thứ 7)</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Đặc biệt: Vào mỗi ngày cuối tuần, lộ trình sẽ yêu cầu bạn làm 1 bài thi Đánh giá năng lực. Điểm số bài thi này sẽ quyết định độ khó của lộ trình cho tuần kế tiếp!
            </p>
            <button 
              onClick={nextStep}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-2 rounded-xl text-sm font-bold shadow-md transition-all"
            >
              Tiếp theo
            </button>
          </div>
        )}

        {/* Tour Step 7: Monthly Assessment */}
        {tourStep === 7 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] bg-white p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.15)] border-2 border-green-100 z-50 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <ChibiMascot mood="excited" size={80} />
              <h3 className="font-bold text-gray-800 text-lg mt-3 mb-1">Bước 3/3: Monthly Test</h3>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Ngoài ra, mỗi đầu tháng sẽ có một bài Đánh giá tổng để rà soát sự tiến bộ dài hạn! Hãy bám sát lộ trình nhé, Moni luôn đồng hành cùng bạn!
              </p>
              <button 
                onClick={() => {
                  stopTour();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl text-base font-bold shadow-lg shadow-green-200 transition-all"
              >
                🚀 Bắt đầu học ngay!
              </button>
            </div>
          </div>
        )}

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

    if (slot.skill === 'VOCABULARY') {
      setActiveSlot(slot);
      setConfirmOpen(true);
      return;
    }

    const id = slot.testId ?? slot.stimulusId;
    if (!id) return;

    setActiveSlot(slot);
    setConfirmOpen(true);
  };

  const handleConfirmPractice = async () => {
    if (!activeSlot) return;
    
    // Special handling for Vocab
    if (activeSlot.skill === 'VOCABULARY') {
      if (activeSlot.taskType === 'VOCAB_LEARN') {
        try {
          const words = await startVocabLearning(activeSlot.id);
          if (words.length > 0) {
            setLearnedWords(words);
            setVocabCurrentIdx(0);
            setNotLearnedIds([]);
            setLearnedIds([]);
            setShowVocabModal(true);
          }
        } catch (err) {
          toast.error('Không khởi tạo được task học từ vựng');
        }
      } else if (activeSlot.taskType === 'VOCAB_TEST') {
        router.push(`/vocabulary/quiz?slotId=${activeSlot.id}`);
      }
      return;
    }

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

  const handleVocabChoice = async (status: 'NOT_LEARNED' | 'LEARNED') => {
    const currentWord = learnedWords[vocabCurrentIdx];
    
    let newNotLearned = notLearnedIds;
    let newLearned = learnedIds;

    if (status === 'NOT_LEARNED') {
      newNotLearned = [...notLearnedIds, currentWord.id];
      setNotLearnedIds(newNotLearned);
    } else {
      newLearned = [...learnedIds, currentWord.id];
      setLearnedIds(newLearned);
    }

    if (vocabCurrentIdx + 1 < learnedWords.length) {
      setVocabCurrentIdx(prev => prev + 1);
    } else {
      setVocabSubmitting(true);
      try {
        await submitVocabLearning(activeSlot!.id, newNotLearned, newLearned);
        toast.success('Đã lưu từ vựng vào sổ tay!');
        setShowVocabModal(false);
        fetchPlan();
      } catch (err) {
        toast.error('Lỗi khi lưu kết quả từ vựng');
      } finally {
        setVocabSubmitting(false);
      }
    }
  };

  // Prevent accidental close during learning
  const handleVocabModalChange = (open: boolean) => {
    if (!open && vocabSubmitting) return; // prevent closing while submitting
    if (!open && vocabCurrentIdx > 0 && vocabCurrentIdx < learnedWords.length) {
       toast.error("Vui lòng hoàn thành quá trình học trước khi đóng!");
       return;
    }
    setShowVocabModal(open);
  };

  const verdict = plan.previousVerdict ? VERDICT_CONFIG[plan.previousVerdict] : null;
  const VerdictIcon = verdict?.icon;

  const isTourActive = tourStep >= 5 && tourStep <= 7;

  return (
    <div id="learning-roadmap-section" className={`bg-white rounded-2xl border border-gray-100 shadow-sm relative transition-all duration-500 ${isTourActive ? 'z-50 ring-4 ring-orange-500 shadow-2xl scale-[1.01]' : ''}`}>
      
      {/* Tour Step 5: Intro */}
      {tourStep === 5 && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full w-80 bg-white p-5 rounded-2xl shadow-2xl border border-orange-100 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex gap-3 mb-3">
            <ChibiMascot mood="excited" size={48} />
            <div>
              <div className="font-bold text-gray-800">Bước 1/3</div>
              <div className="text-orange-600 text-sm font-semibold">Weekly Plan Cá Nhân Hoá</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Đây là hệ thống Weekly Plan cực kỳ thông minh của Moni. Khối lượng bài tập và kỹ năng được tự động đo ni đóng giày dựa trên bài đánh giá hiện tại của bạn!
          </p>
          <button 
            onClick={nextStep}
            className="w-full bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white py-2 rounded-xl text-sm font-bold shadow-md transition-all"
          >
            Tiếp theo
          </button>
        </div>
      )}

      {/* Tour Step 6: Sat Assessment */}
      {tourStep === 6 && (
        <div className="absolute top-4 right-4 w-72 bg-white p-5 rounded-2xl shadow-2xl border border-purple-100 z-50 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex gap-3 mb-3">
            <ChibiMascot mood="thinking" size={48} />
            <div>
              <div className="font-bold text-gray-800">Bước 2/3</div>
              <div className="text-purple-600 text-sm font-semibold">Weekly Assessment (Thứ 7)</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Đặc biệt: Vào mỗi ngày cuối tuần, lộ trình sẽ yêu cầu bạn làm 1 bài thi Đánh giá năng lực. Điểm số bài thi này sẽ quyết định độ khó của lộ trình cho tuần kế tiếp!
          </p>
          <button 
            onClick={nextStep}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-2 rounded-xl text-sm font-bold shadow-md transition-all"
          >
            Tiếp theo
          </button>
        </div>
      )}

      {/* Tour Step 7: Monthly Assessment */}
      {tourStep === 7 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] bg-white p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.15)] border-2 border-green-100 z-50 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center text-center">
            <ChibiMascot mood="excited" size={80} />
            <h3 className="font-bold text-gray-800 text-lg mt-3 mb-1">Bước 3/3: Monthly Test</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Ngoài ra, mỗi đầu tháng sẽ có một bài Đánh giá tổng để rà soát sự tiến bộ dài hạn! Hãy bám sát lộ trình nhé, Moni luôn đồng hành cùng bạn!
            </p>
            <button 
              onClick={() => {
                stopTour();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl text-base font-bold shadow-lg shadow-green-200 transition-all"
            >
              🚀 Bắt đầu học ngay!
            </button>
          </div>
        </div>
      )}

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
        description={activeSlot ? `Bạn đang chuẩn bị mở bài ${formatStimulusTitle(activeSlot.stimulusTitle, activeSlot.skill, activeSlot.taskType === 'ASSESSMENT', activeSlot.taskType)} (${activeSlot.skill}).` : undefined}
        confirmText="Ok làm luôn"
        cancelText="Đợi xíu"
        variant="default"
        onConfirm={handleConfirmPractice}
      />

      <Dialog open={showVocabModal} onOpenChange={handleVocabModalChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0 sm:rounded-[24px]">
          {learnedWords.length > 0 && (
            <div className="flex flex-col h-full bg-slate-50">
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-800">Từ vựng hôm nay</h3>
                </div>
                <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  {vocabCurrentIdx + 1} / {learnedWords.length}
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/50 flex flex-col items-center justify-center min-h-[300px] text-center mb-6 relative overflow-hidden">
                  {/* Decorative faint background element */}
                  <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50" />
                  
                  <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full uppercase tracking-wider mb-4 border border-indigo-100/50">
                    {learnedWords[vocabCurrentIdx].pos}
                  </span>
                  
                  <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2 tracking-tight">
                    {learnedWords[vocabCurrentIdx].word}
                  </h2>
                  
                  {learnedWords[vocabCurrentIdx].phonetic && (
                    <p className="text-indigo-400 font-mono text-base mb-6">
                      {learnedWords[vocabCurrentIdx].phonetic}
                    </p>
                  )}
                  
                  <p className="text-lg text-gray-700 font-medium leading-relaxed max-w-[280px]">
                    {learnedWords[vocabCurrentIdx].meaning}
                  </p>
                  
                  {learnedWords[vocabCurrentIdx].definition && (
                    <p className="text-sm text-gray-500 mt-3 italic max-w-sm">
                      "{learnedWords[vocabCurrentIdx].definition}"
                    </p>
                  )}
                  
                  {learnedWords[vocabCurrentIdx].example && (
                    <div className="mt-8 bg-slate-50 w-full p-4 rounded-2xl border border-slate-100 text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Ví dụ áp dụng</span>
                      <p className="text-slate-600 text-sm">
                        {learnedWords[vocabCurrentIdx].example}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleVocabChoice('NOT_LEARNED')}
                    disabled={vocabSubmitting}
                    className="flex flex-col items-center justify-center p-4 bg-white border border-rose-100/60 rounded-2xl shadow-sm hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span className="text-xl mb-1">🤔</span>
                    <span className="font-semibold text-rose-600 text-sm">Chưa học</span>
                  </button>
                  <button
                    onClick={() => handleVocabChoice('LEARNED')}
                    disabled={vocabSubmitting}
                    className="flex flex-col items-center justify-center p-4 bg-white border border-emerald-100/60 rounded-2xl shadow-sm hover:bg-emerald-50 hover:border-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span className="text-xl mb-1">🤩</span>
                    <span className="font-semibold text-emerald-600 text-sm">Đã học</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
