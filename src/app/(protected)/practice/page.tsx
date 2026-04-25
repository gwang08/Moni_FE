'use client';

import { Suspense, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePracticeStore } from '@/store/practice-store';
import { useAuthStore } from '@/store/auth-store';
import { usePracticeExercises } from '@/hooks/use-practice-exercises';
import { ModeSelectionModal } from '@/components/practice/mode-selection-modal';
import { SpeakingModeDialog } from '@/components/speaking/speaking-mode-dialog';
import { getServices, getServiceQuota, type ServiceQuotaResponse } from '@/lib/payment-api';
import { getMyActiveSubscription } from '@/lib/subscription-api';
import type { UserSubscriptionResponse } from '@/types/subscription.types';
import { PracticeSidebar } from '@/components/practice/practice-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Pencil, Headphones, Mic, Search, CheckCircle, Users, Play, Clock } from 'lucide-react';
import { toMinutes } from '@/lib/duration-utils';
import { getAllActiveSessions, type ExamSession } from '@/lib/exam-api';
import { SkeletonCard } from '@/components/ui/skeleton';
import { QuestionTypeFilter, QUESTION_TYPE_LABELS } from '@/components/practice/question-type-filter';
import { WritingFiltersPanel, type WritingFilters } from '@/components/practice/writing-filters-panel';
import { WRITING_TASK1_TYPE_CODES, WRITING_TASK2_TYPE_CODES } from '@/components/practice/writing-filter-constants';
import type { Exercise, Skill, TestMode, TestType } from '@/types/practice.types';
import { useLoginPrompt } from '@/hooks/use-login-prompt';
import { LoginPromptDialog } from '@/components/auth/login-prompt-dialog';

const SKILL_CONFIG = {
  reading: { icon: BookOpen, color: 'text-blue-700', bgColor: 'bg-blue-100', gradient: 'from-blue-500 to-indigo-500', label: 'Reading' },
  listening: { icon: Headphones, color: 'text-purple-700', bgColor: 'bg-purple-100', gradient: 'from-purple-500 to-violet-500', label: 'Listening' },
  writing: { icon: Pencil, color: 'text-emerald-700', bgColor: 'bg-emerald-100', gradient: 'from-emerald-500 to-teal-500', label: 'Writing' },
  speaking: { icon: Mic, color: 'text-orange-700', bgColor: 'bg-orange-100', gradient: 'from-orange-500 to-amber-500', label: 'Speaking' },
};

const DEFAULT_IMAGES: Record<string, string> = {
  reading: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=200&fit=crop',
  listening: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=200&fit=crop',
  writing: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=200&fit=crop',
  speaking: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
};

function getTestSectionLabel(skill: string, section?: number | null) {
  if (section == null) return null;
  if (skill === 'reading') return `Passage ${section}`;
  if (skill === 'listening') return `Section ${section}`;
  if (skill === 'writing') return `Task ${section}`;
  if (skill === 'speaking') return `Part ${section}`;
  return String(section);
}

export default function PracticePageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-56px)]"><div className="w-64 bg-gray-50" /><main className="flex-1 p-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => (<SkeletonCard key={i} className="h-56" />))}</div></main></div>}
    >
      <PracticePage />
    </Suspense>
  );
}

function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = useAuthStore((state) => state.user?.role);
  const initialSkill = (searchParams.get('skill') as Skill) || 'reading';
  
  // Redirect ADMIN and EXPERT away from practice page
  useEffect(() => {
    if (userRole === 'ADMIN') {
      router.replace('/admin');
      return;
    }
    if (userRole === 'EXPERT') {
      router.replace('/expert/dashboard');
      return;
    }
  }, [userRole, router]);
  
  // URL uses 'q' param: 'test' for Phần thi (PRACTICE), 'full-test' for Bài thi (FULL_TEST)
  const qParam = searchParams.get('q');
  const initialMode: TestMode = qParam === 'full-test' ? 'FULL_TEST' : 'PRACTICE';
  const initialPassage = searchParams.get('part') ? parseInt(searchParams.get('part')!) : null;
  const initialTestType = (searchParams.get('type') as TestType) || null;
  const initialQuestionType = searchParams.get('question-type') || null;
  const initialWritingType = searchParams.get('writing-type') || null;
  const initialWritingTopic = searchParams.get('writing-topic') || null;
  const [activeSkill, setActiveSkill] = useState<Skill>(initialSkill);
  const [activeMode, setActiveMode] = useState<TestMode>(initialMode);
  const [activePassage, setActivePassage] = useState<number | null>(initialPassage);
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeQuestionType, setActiveQuestionType] = useState<string | null>(initialQuestionType);
  const [activeTestType, setActiveTestType] = useState<TestType | null>(initialTestType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [speakingModeOpen, setSpeakingModeOpen] = useState(false);
  const [speakingTestId, setSpeakingTestId] = useState<string>('');
  // aiQuota phản ánh free-daily-quota của Speaking AI: chưa dùng hôm nay → effectiveCost=0 (miễn phí)
  const [aiQuota, setAiQuota] = useState<ServiceQuotaResponse | null>(null);
  const [expertCost, setExpertCost] = useState<number | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscriptionResponse | null>(null);
  const servicesFetched = useRef(false);
  const [activeSessions, setActiveSessions] = useState<Map<number, ExamSession>>(new Map());

  // Writing filters state
  const [writingFilters, setWritingFilters] = useState<WritingFilters>({
    task: null,
    type: initialWritingType,
    topic: initialWritingTopic,
  });

  // Refs to track latest filter values synchronously (avoid stale closure issues)
  const filterRef = useRef({
    skill: initialSkill,
    mode: initialMode,
    passage: initialPassage,
    testType: initialTestType as TestType | null,
    questionType: initialQuestionType as string | null,
    writingType: initialWritingType,
    writingTopic: initialWritingTopic,
  });

  // Helper to build and update URL synchronously
  const updateUrlSync = useCallback((overrides?: Partial<typeof filterRef.current>) => {
    const current = { ...filterRef.current, ...overrides };
    const newParams = new URLSearchParams();
    newParams.set('skill', current.skill);
    newParams.set('q', current.mode === 'FULL_TEST' ? 'full-test' : 'test');
    if (current.passage != null) newParams.set('part', String(current.passage));
    if (current.testType) newParams.set('type', current.testType.toLowerCase());
    if (current.questionType) newParams.set('question-type', current.questionType);
    if (current.writingType) newParams.set('writing-type', current.writingType);
    if (current.writingTopic) newParams.set('writing-topic', current.writingTopic);
    router.replace(`/practice?${newParams.toString()}`, { scroll: false });
  }, [router]);

  const handleSkillChange = useCallback((skill: Skill) => {
    // Update ref immediately for synchronous URL update
    filterRef.current = { skill, mode: 'PRACTICE', passage: null, testType: null, questionType: null, writingType: null, writingTopic: null };
    setActiveSkill(skill);
    setActiveMode('PRACTICE');
    setActivePassage(null);
    setShowCompleted(false);
    setActiveTestType(null);
    setActiveQuestionType(null);
    setSearchQuery('');
    setWritingFilters({ task: null, type: null, topic: null });
    updateUrlSync({ skill, mode: 'PRACTICE', passage: null, testType: null, questionType: null, writingType: null, writingTopic: null });
  }, [updateUrlSync]);

  const handleModeChange = useCallback((mode: TestMode) => {
    filterRef.current = { ...filterRef.current, mode, passage: null };
    setActiveMode(mode);
    setActivePassage(null);
    updateUrlSync({ mode, passage: null });
  }, [updateUrlSync]);

  const handlePassageChange = useCallback((passage: number | null) => {
    filterRef.current = { ...filterRef.current, passage };
    setActivePassage(passage);
    updateUrlSync({ passage });
  }, [updateUrlSync]);

  const handleTestTypeChange = useCallback((testType: TestType | null) => {
    filterRef.current = { ...filterRef.current, testType };
    setActiveTestType(testType);
    updateUrlSync({ testType });
  }, [updateUrlSync]);

  const handleQuestionTypeChange = useCallback((questionType: string | null) => {
    filterRef.current = { ...filterRef.current, questionType };
    setActiveQuestionType(questionType);
    updateUrlSync({ questionType });
  }, [updateUrlSync]);

  const handleWritingFiltersChange = useCallback((filters: WritingFilters) => {
    setWritingFilters(filters);
    filterRef.current = { ...filterRef.current, writingType: filters.type, writingTopic: filters.topic };
    updateUrlSync({ writingType: filters.type, writingTopic: filters.topic });
  }, [updateUrlSync]);

  useEffect(() => {
    if (servicesFetched.current) return;
    servicesFetched.current = true;
    // Expert cost lấy từ /services (giá cố định); Speaking AI dùng /services/quota để biết còn free hôm nay không
    getServices()
      .then((services) => {
        setExpertCost(services.find((s) => s.serviceCode === 'EXPERT_SPEAKING_SCORE')?.creditCost ?? null);
      })
      .catch(() => {});
    getServiceQuota('AI_SPEAKING_SCORE').then(setAiQuota).catch(() => {});
    getMyActiveSubscription().then(setActiveSubscription).catch(() => {});
    // Fetch active exam sessions
    getAllActiveSessions()
      .then((sessions) => {
        const map = new Map<number, ExamSession>();
        sessions.forEach((s) => map.set(s.testId, s));
        setActiveSessions(map);
      })
      .catch(() => {});
  }, []);
  // Realtime countdown: decrement remainingSeconds every second
  useEffect(() => {
    if (activeSessions.size === 0) return;
    const interval = setInterval(() => {
      setActiveSessions((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [testId, session] of next) {
          if (session.remainingSeconds > 0) {
            next.set(testId, { ...session, remainingSeconds: session.remainingSeconds - 1 });
            changed = true;
          } else {
            next.delete(testId);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSessions.size]);

  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt();

  const completedExercises = usePracticeStore((state) => state.completedExercises);
  const { exercises, loading, error, page, totalPages, setPage, retry } = usePracticeExercises(activeSkill, activePassage, activeMode);
  const isAdminPreview = useAuthStore((state) => state.user?.role) === 'ADMIN';

  // Collect all unique question types from current exercises (for filter chips)
  const availableQuestionTypes = useMemo(() => {
    const types = new Set<string>();
    exercises.forEach((e) => e.questionTypes?.forEach((qt) => types.add(qt)));
    return Array.from(types).sort();
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    let list = exercises;
    // Filter by testMode on frontend (backend returns all PUBLISHED tests)
    // "Bài thi" = FULL_TEST only, "Phần thi" = PRACTICE or null
    list = list.filter((e) => {
      if (activeMode === 'FULL_TEST') return e.testMode === 'FULL_TEST';
      return !e.testMode || e.testMode === 'PRACTICE';
    });
    // Filter by testType (Academic / General Training)
    if (activeTestType) {
      list = list.filter((e) => !e.testType || e.testType === activeTestType || e.testType === 'BOTH');
    }
    // Filter by question type (for reading/listening)
    if (activeQuestionType) {
      list = list.filter((e) => e.questionTypes?.includes(activeQuestionType));
    }
    // Writing-specific filters
    if (activeSkill === 'writing') {
      // Filter by task (section) - use activePassage from sidebar
      if (activePassage != null) {
        list = list.filter((e) => e.section === activePassage);
      }
      // Filter by writing type (question type) - single select
      if (writingFilters.type) {
        const typeCode = WRITING_TASK1_TYPE_CODES[writingFilters.type] || WRITING_TASK2_TYPE_CODES[writingFilters.type];
        if (typeCode) {
          list = list.filter((e) => e.questionTypes?.includes(typeCode));
        }
      }
      // Filter by topic - skip for now as we need tag name mapping
      // TODO: Implement topic filtering when tag mapping is available
    }
    // Filter completed/not — in-progress tests (active session) always show in "Bài chưa làm"
    if (!isAdminPreview) {
      if (showCompleted) {
        list = list.filter((e) => completedExercises.includes(e.id) && !activeSessions.has(Number(e.id)));
      } else {
        list = list.filter((e) => !completedExercises.includes(e.id) || activeSessions.has(Number(e.id)));
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    // In-progress tests (active session) float to the top
    list.sort((a, b) => {
      const aActive = activeSessions.has(Number(a.id)) ? 1 : 0;
      const bActive = activeSessions.has(Number(b.id)) ? 1 : 0;
      return bActive - aActive;
    });
    return list;
  }, [exercises, activeMode, activeTestType, activeQuestionType, activeSkill, activePassage, writingFilters.type, showCompleted, searchQuery, completedExercises, isAdminPreview, activeSessions]);

  const handleStartExercise = (exercise: Exercise) => {
    requireAuth(() => {
      // Speaking: show mode dialog (AI / Expert)
      if (exercise.skill === 'speaking') {
        setSpeakingTestId(String(exercise.id));
        setSpeakingModeOpen(true);
        return;
      }
      // Writing & other skills: show practice/exam mode selection
      setSelectedExercise(exercise);
      setModalOpen(true);
    });
  };

  const modeLabel = activeMode === 'FULL_TEST' ? 'Bài thi' : 'Phần thi';

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-slate-50/60">
      <PracticeSidebar
        activeSkill={activeSkill}
        activeMode={activeMode}
        activePassage={activePassage}
        onSkillChange={handleSkillChange}
        onModeChange={handleModeChange}
        onPassageChange={handlePassageChange}
        onWritingTaskChange={(task) => {
          const passage = task !== null ? task : null;
          setActivePassage(passage);
          filterRef.current = { ...filterRef.current, passage };
          updateUrlSync({ passage });
        }}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-full">
        {/* Mobile Skill Tabs */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 overflow-x-auto lg:hidden">
          {(Object.keys(SKILL_CONFIG) as Skill[]).map((skill) => {
            const config = SKILL_CONFIG[skill];
            const Icon = config.icon;
            return (
              <button
                key={skill}
                onClick={() => handleSkillChange(skill)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all ${
                  activeSkill === skill
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {config.label}
              </button>
            );
          })}
        </div>

        <div className="p-5 md:p-7 space-y-5">
          {/* Header + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                {(() => { const Icon = SKILL_CONFIG[activeSkill].icon; return <Icon className={`h-5 w-5 ${SKILL_CONFIG[activeSkill].color}`} />; })()}
                {SKILL_CONFIG[activeSkill].label}
                <span className="text-slate-300 font-normal mx-1">/</span>
                <span className="text-slate-600 font-bold">{modeLabel}</span>
              </h1>
              {activePassage && (
                <p className="text-[13px] text-slate-500 font-medium mt-0.5 ml-8">
                  {activeSkill === 'writing' ? `Task ${activePassage}` : `Passage ${activePassage}`}
                </p>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm theo tên bài tập..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-white border-slate-200 rounded-xl text-[13px] font-medium focus:border-teal-400 focus:ring-teal-400/20 shadow-sm"
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              <button
                onClick={() => setShowCompleted(false)}
                className={`px-4 py-2 rounded-lg text-[12.5px] font-bold transition-all ${
                  !showCompleted ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Bài chưa làm
              </button>
              <button
                onClick={() => setShowCompleted(true)}
                className={`px-4 py-2 rounded-lg text-[12.5px] font-bold transition-all ${
                  showCompleted ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Bài đã làm
              </button>
            </div>

            {/* Test Type Filter (Academic / General Training) */}
            {(activeSkill === 'reading' || activeSkill === 'writing') && (
              <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                {([null, 'ACADEMIC', 'GENERAL_TRAINING'] as (TestType | null)[]).map((type) => {
                  const label = type === null ? 'Tất cả' : type === 'ACADEMIC' ? 'Academic' : 'General Training';
                  const isActive = activeTestType === type;
                  return (
                    <button
                      key={type ?? 'all'}
                      onClick={() => handleTestTypeChange(type)}
                      className={`px-3 py-2 rounded-lg text-[12.5px] font-bold transition-all whitespace-nowrap ${
                        isActive ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <span className="text-[12px] text-slate-400 font-semibold ml-auto">
              {filteredExercises.length} bài
            </span>
          </div>

          {/* Question Type Filter — for reading/listening */}
          {(activeSkill === 'reading' || activeSkill === 'listening') && (
            <QuestionTypeFilter
              availableTypes={availableQuestionTypes}
              activeType={activeQuestionType}
              onTypeChange={handleQuestionTypeChange}
            />
          )}

          {/* Writing Filters Panel */}
          {activeSkill === 'writing' && (
            <WritingFiltersPanel
              filters={writingFilters}
              onChange={handleWritingFiltersChange}
              activePassage={activePassage}
            />
          )}

          {/* Content Area */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/30 p-16 text-center">
              <p className="text-[14px] font-bold text-rose-600 mb-3">{error}</p>
              <Button onClick={retry} variant="outline" className="rounded-xl">Thử lại</Button>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-16 text-center">
              <p className="text-[14px] font-bold text-slate-500">Không tìm thấy bài tập nào.</p>
              <p className="text-[12.5px] text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredExercises.map((exercise) => {
                  const config = SKILL_CONFIG[exercise.skill];
                  const isCompleted = completedExercises.includes(exercise.id);
                  const imgSrc = exercise.thumbnailUrl || DEFAULT_IMAGES[exercise.skill] || DEFAULT_IMAGES.reading;
                  const activeExam = activeSessions.get(Number(exercise.id));
                  const remainingMin = activeExam ? Math.floor(activeExam.remainingSeconds / 60) : 0;
                  const remainingSec = activeExam ? activeExam.remainingSeconds % 60 : 0;
                  return (
                    <div
                      key={exercise.id}
                      className={`relative bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-sm ${
                        activeExam ? 'ring-2 ring-orange-400' : ''
                      }`}
                      onClick={() => activeExam ? router.push(`/practice/${exercise.skill}/${exercise.id}?mode=exam`) : handleStartExercise(exercise)}
                    >
                      <div className="relative h-40 bg-slate-100 overflow-hidden">
                        <img src={imgSrc} alt={exercise.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        <div className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-sm text-white text-[10.5px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Users className="h-3 w-3" />{exercise.attemptCount ?? 0} lượt
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                          <Badge className={`${config.bgColor} ${config.color} border-0 text-[10.5px] font-bold shadow-sm`}>{config.label}</Badge>
                          {exercise.section && (
                            <Badge className="bg-white/90 text-slate-700 border-0 text-[10.5px] font-bold shadow-sm">
                              {getTestSectionLabel(exercise.skill, exercise.section)}
                            </Badge>
                          )}
                        </div>
                        {activeExam && (
                          <div className="absolute top-2.5 right-2.5 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-lg">
                            <Clock className="h-3 w-3" />
                            {remainingMin}:{String(remainingSec).padStart(2, '0')}
                          </div>
                        )}
                        {!activeExam && isCompleted && (
                          <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-[13.5px] font-bold text-slate-900 mb-1.5 line-clamp-2 leading-snug">{exercise.title}</h3>
                        <div className="flex items-center gap-1.5 text-[11.5px] text-slate-400 font-medium">
                          {(exercise.questionCount ?? 0) > 0 && <span>{exercise.questionCount} câu</span>}
                          {exercise.duration && exercise.skill !== 'listening' && exercise.skill !== 'speaking' && <span>· {toMinutes(exercise.duration)} phút</span>}
                        </div>
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col p-5">
                        <h3 className="text-[14px] font-extrabold text-slate-900 line-clamp-2 mb-3">{exercise.title}</h3>
                        {exercise.questionTypes && exercise.questionTypes.length > 0 && (
                          <ul className="text-[12.5px] text-slate-600 space-y-1.5 flex-1 overflow-y-auto">
                            {exercise.questionTypes.map((qt) => (
                              <li key={qt} className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${config.gradient} shrink-0`} />
                                <span className="font-medium">{QUESTION_TYPE_LABELS[qt] || qt.replace(/_/g, ' ')}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {activeExam ? (
                          <Button className="w-full mt-auto bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-bold text-[13px] shadow-lg flex items-center gap-2 py-5">
                            <Play className="h-4 w-4" /> Làm tiếp ({remainingMin}:{String(remainingSec).padStart(2, '0')})
                          </Button>
                        ) : (
                          <Button className="w-full mt-auto bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-bold text-[13px] shadow-lg py-5">
                            Làm bài
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-8 pb-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="rounded-xl text-[12.5px] font-bold"
                  >
                    Trang trước
                  </Button>
                  <span className="text-[12.5px] text-slate-500 font-bold px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm tabular-nums">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="rounded-xl text-[12.5px] font-bold"
                  >
                    Trang sau
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <ModeSelectionModal exercise={selectedExercise} open={modalOpen} onOpenChange={setModalOpen} />

      <SpeakingModeDialog
        open={speakingModeOpen}
        testId={speakingTestId}
        aiQuota={aiQuota}
        expertCost={expertCost}
        activeSubscription={activeSubscription}
        onSelectAI={() => {
          setSpeakingModeOpen(false);
          router.push(`/speaking-exam/${speakingTestId}`);
        }}
        onClose={() => setSpeakingModeOpen(false)}
      />
      <LoginPromptDialog open={showPrompt} onOpenChange={setShowPrompt} />
    </div>
  );
}
