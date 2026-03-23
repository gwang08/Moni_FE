'use client';

import { Suspense, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePracticeStore } from '@/store/practice-store';
import { usePracticeExercises } from '@/hooks/use-practice-exercises';
import { ModeSelectionModal } from '@/components/practice/mode-selection-modal';
import { SpeakingModeDialog } from '@/components/speaking/speaking-mode-dialog';
import { getServices } from '@/lib/payment-api';
import { PracticeSidebar } from '@/components/practice/practice-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Pencil, Headphones, Mic, Search, CheckCircle, Users } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { QuestionTypeFilter, QUESTION_TYPE_LABELS } from '@/components/practice/question-type-filter';
import type { Exercise, Skill, TestMode, TestType } from '@/types/practice.types';
import { useLoginPrompt } from '@/hooks/use-login-prompt';
import { LoginPromptDialog } from '@/components/auth/login-prompt-dialog';

const SKILL_CONFIG = {
  reading: { icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-500', label: 'Reading' },
  listening: { icon: Headphones, color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-500', label: 'Listening' },
  writing: { icon: Pencil, color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-500', label: 'Writing' },
  speaking: { icon: Mic, color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-500', label: 'Speaking' },
};

const DEFAULT_IMAGES: Record<string, string> = {
  reading: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=200&fit=crop',
  listening: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=200&fit=crop',
  writing: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=200&fit=crop',
  speaking: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
};

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
  const initialSkill = (searchParams.get('skill') as Skill) || 'reading';
  const [activeSkill, setActiveSkill] = useState<Skill>(initialSkill);
  const [activeMode, setActiveMode] = useState<TestMode>('PRACTICE');

  const handleSkillChange = useCallback((skill: Skill) => {
    setActiveSkill(skill);
    setActiveTestType(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set('skill', skill);
    router.replace(`/practice?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);
  const [activePassage, setActivePassage] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeQuestionType, setActiveQuestionType] = useState<string | null>(null);
  const [activeTestType, setActiveTestType] = useState<TestType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [speakingModeOpen, setSpeakingModeOpen] = useState(false);
  const [speakingTestId, setSpeakingTestId] = useState<string>('');
  const [aiCost, setAiCost] = useState<number | null>(null);
  const [expertCost, setExpertCost] = useState<number | null>(null);
  const servicesFetched = useRef(false);

  useEffect(() => {
    if (servicesFetched.current) return;
    servicesFetched.current = true;
    getServices()
      .then((services) => {
        setAiCost(services.find((s) => s.serviceCode === 'AI_SPEAKING_SCORE')?.creditCost ?? null);
        setExpertCost(services.find((s) => s.serviceCode === 'EXPERT_SPEAKING_SCORE')?.creditCost ?? null);
      })
      .catch(() => {});
  }, []);
  const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt();

  const completedExercises = usePracticeStore((state) => state.completedExercises);
  const { exercises, loading, error, page, totalPages, setPage, retry } = usePracticeExercises(activeSkill, activePassage);

  // Collect all unique question types from current exercises (for filter chips)
  const availableQuestionTypes = useMemo(() => {
    const modeFiltered = exercises.filter((e) => (e.testMode || 'PRACTICE') === activeMode);
    const types = new Set<string>();
    modeFiltered.forEach((e) => e.questionTypes?.forEach((qt) => types.add(qt)));
    return Array.from(types).sort();
  }, [exercises, activeMode]);

  const filteredExercises = useMemo(() => {
    let list = exercises;
    // Filter by testMode
    list = list.filter((e) => (e.testMode || 'PRACTICE') === activeMode);
    // Filter by testType (Academic / General Training)
    if (activeTestType) {
      list = list.filter((e) => !e.testType || e.testType === activeTestType || e.testType === 'BOTH');
    }
    // Filter by question type
    if (activeQuestionType) {
      list = list.filter((e) => e.questionTypes?.includes(activeQuestionType));
    }
    // Filter completed/not
    if (showCompleted) {
      list = list.filter((e) => completedExercises.includes(e.id));
    } else {
      list = list.filter((e) => !completedExercises.includes(e.id));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    return list;
  }, [exercises, activeMode, activeTestType, activeQuestionType, showCompleted, searchQuery, completedExercises]);

  const handleStartExercise = (exercise: Exercise) => {
    requireAuth(() => {
      // Speaking: show mode dialog (AI / Expert)
      if (exercise.skill === 'speaking') {
        setSpeakingTestId(String(exercise.id));
        setSpeakingModeOpen(true);
        return;
      }
      // Writing: go straight to practice
      if (exercise.skill === 'writing') {
        router.push(`/practice/${exercise.skill}/${exercise.id}`);
        return;
      }
      setSelectedExercise(exercise);
      setModalOpen(true);
    });
  };

  const modeLabel = activeMode === 'FULL_TEST' ? 'Full đề' : 'Bài lẻ';

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <PracticeSidebar
        activeSkill={activeSkill}
        activeMode={activeMode}
        activePassage={activePassage}
        onSkillChange={handleSkillChange}
        onModeChange={setActiveMode}
        onPassageChange={setActivePassage}
      />

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Mobile Skill Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b pb-4 lg:hidden">
          {(Object.keys(SKILL_CONFIG) as Skill[]).map((skill) => {
            const config = SKILL_CONFIG[skill];
            const Icon = config.icon;
            return (
              <button
                key={skill}
                onClick={() => handleSkillChange(skill)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeSkill === skill ? `${config.bgColor} ${config.color}` : 'hover:bg-gray-100'}`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {SKILL_CONFIG[activeSkill].label} — {modeLabel}
          </h1>
          {activePassage && (
            <p className="text-sm text-gray-500 mt-1">Passage {activePassage}</p>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Button variant={!showCompleted ? 'default' : 'outline'} size="sm" onClick={() => setShowCompleted(false)}>Bài chưa làm</Button>
            <Button variant={showCompleted ? 'default' : 'outline'} size="sm" onClick={() => setShowCompleted(true)} className={showCompleted ? 'bg-orange-500 hover:bg-orange-600' : ''}>Bài đã làm</Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Tìm theo tên bài tập" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64 bg-white border-gray-300 focus:border-orange-400" />
          </div>
        </div>

        {/* Test Type Filter (Academic / General Training) — only for Reading & Listening */}
        {(activeSkill === 'reading' || activeSkill === 'listening') && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500 mr-1">Dạng đề:</span>
            {([null, 'ACADEMIC', 'GENERAL_TRAINING'] as (TestType | null)[]).map((type) => {
              const label = type === null ? 'Tất cả' : type === 'ACADEMIC' ? 'Academic' : 'General Training';
              const isActive = activeTestType === type;
              return (
                <button
                  key={type ?? 'all'}
                  onClick={() => setActiveTestType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Question Type Filter — only for reading/listening */}
        {(activeSkill === 'reading' || activeSkill === 'listening') && (
          <QuestionTypeFilter
            availableTypes={availableQuestionTypes}
            activeType={activeQuestionType}
            onTypeChange={setActiveQuestionType}
          />
        )}

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} className="h-56" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={retry} variant="outline">Thử lại</Button>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Không tìm thấy bài tập nào.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredExercises.map((exercise) => {
                const config = SKILL_CONFIG[exercise.skill];
                const isCompleted = completedExercises.includes(exercise.id);
                const imgSrc = exercise.thumbnailUrl || DEFAULT_IMAGES[exercise.skill] || DEFAULT_IMAGES.reading;
                return (
                  <div key={exercise.id} className="relative bg-white rounded-xl overflow-hidden border hover:shadow-lg transition-all cursor-pointer group" onClick={() => handleStartExercise(exercise)}>
                    <div className="relative h-36 bg-gray-200 overflow-hidden">
                      <img src={imgSrc} alt={exercise.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Users className="h-3 w-3" />{exercise.attemptCount ?? 0} lượt làm bài
                      </div>
                      <Badge className={`absolute bottom-2 left-2 ${config.bgColor} ${config.color} border-0`}>{config.label}</Badge>
                      {isCompleted && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{exercise.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {(exercise.questionCount ?? 0) > 0 && <span>{exercise.questionCount} câu hỏi</span>}
                        {exercise.duration && <span>· {Math.floor(exercise.duration / 60)} phút</span>}
                      </div>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col p-4">
                      <h3 className="font-bold text-gray-800 line-clamp-2 mb-2">{exercise.title}</h3>
                      {exercise.questionTypes && exercise.questionTypes.length > 0 && (
                        <ul className="text-sm text-gray-600 space-y-1 flex-1">
                          {exercise.questionTypes.map((qt) => (
                            <li key={qt} className="flex items-center gap-1">
                              <span className="text-gray-400">·</span> {QUESTION_TYPE_LABELS[qt] || qt.replace(/_/g, ' ')}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button className="w-full mt-auto bg-orange-500 hover:bg-orange-600 text-white rounded-full">
                        Làm bài
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page <= 1}>Trang trước</Button>
                <span className="text-sm text-gray-600">Trang {page} / {totalPages}</span>
                <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Trang sau</Button>
              </div>
            )}
          </>
        )}
      </main>

      <ModeSelectionModal exercise={selectedExercise} open={modalOpen} onOpenChange={setModalOpen} />

      <SpeakingModeDialog
        open={speakingModeOpen}
        testId={speakingTestId}
        aiCost={aiCost}
        expertCost={expertCost}
        onSelectAI={() => {
          setSpeakingModeOpen(false);
          router.push(`/practice/speaking/${speakingTestId}`);
        }}
        onClose={() => setSpeakingModeOpen(false)}
      />
      <LoginPromptDialog open={showPrompt} onOpenChange={setShowPrompt} />
    </div>
  );
}
