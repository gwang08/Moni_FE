'use client';

import { useState, useMemo } from 'react';
import { EXERCISES } from '@/data/exercises';
import { usePracticeStore } from '@/store/practice-store';
import { ModeSelectionModal } from '@/components/practice/mode-selection-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Pencil,
  Headphones,
  Mic,
  Search,
  Clock,
  CheckCircle,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { Exercise, Skill } from '@/types/practice.types';

const SKILL_CONFIG = {
  reading: { icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-500', label: 'Reading' },
  listening: { icon: Headphones, color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-500', label: 'Listening' },
  writing: { icon: Pencil, color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-500', label: 'Writing' },
  speaking: { icon: Mic, color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-500', label: 'Speaking' },
};

const SKILL_IMAGES: Record<string, string> = {
  'reading-1': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=200&fit=crop',
  'reading-2': 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=400&h=200&fit=crop',
  'reading-3': 'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=400&h=200&fit=crop',
  'writing-1': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=200&fit=crop',
  'writing-2': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop',
  'writing-3': 'https://images.unsplash.com/photo-1518173946687-a4c036bc9d1e?w=400&h=200&fit=crop',
  'listening-1': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=200&fit=crop',
  'listening-2': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=200&fit=crop',
  'listening-3': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=200&fit=crop',
  'speaking-1': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
  'speaking-2': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
  'speaking-3': 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=400&h=200&fit=crop',
};

export default function PracticePage() {
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSkills, setExpandedSkills] = useState<Skill[]>(['reading']);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const completedExercises = usePracticeStore((state) => state.completedExercises);

  const filteredExercises = useMemo(() => {
    let exercises = EXERCISES;

    // Filter by skill
    if (activeSkill) {
      exercises = exercises.filter((e) => e.skill === activeSkill);
    }

    // Filter by completion status
    if (showCompleted) {
      exercises = exercises.filter((e) => completedExercises.includes(e.id));
    } else {
      exercises = exercises.filter((e) => !completedExercises.includes(e.id));
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      exercises = exercises.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query)
      );
    }

    return exercises;
  }, [activeSkill, showCompleted, searchQuery, completedExercises]);

  const toggleSkillExpand = (skill: Skill) => {
    setExpandedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleStartExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setModalOpen(true);
  };

  const getViewCount = (id: string) => {
    // Mock view counts
    const counts: Record<string, number> = {
      'reading-1': 1941,
      'reading-2': 2452,
      'reading-3': 2365,
      'writing-1': 1823,
      'writing-2': 2108,
      'writing-3': 1567,
      'listening-1': 5771,
      'listening-2': 1025,
      'listening-3': 8216,
      'speaking-1': 2774,
      'speaking-2': 1892,
      'speaking-3': 2134,
    };
    return counts[id] || 1000;
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r p-4 hidden lg:block">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Luyện tập</h2>

        <div className="space-y-2">
          {(Object.keys(SKILL_CONFIG) as Skill[]).map((skill) => {
            const config = SKILL_CONFIG[skill];
            const Icon = config.icon;
            const isExpanded = expandedSkills.includes(skill);
            const skillExercises = EXERCISES.filter((e) => e.skill === skill);

            return (
              <div key={skill} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => {
                    toggleSkillExpand(skill);
                    setActiveSkill(activeSkill === skill ? null : skill);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                    activeSkill === skill ? config.bgColor : ''
                  }`}
                >
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <span className="font-medium flex-1 text-left">{config.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t bg-gray-50 p-2 space-y-1">
                    <button
                      onClick={() => setActiveSkill(activeSkill === skill ? null : skill)}
                      className="w-full text-left text-sm py-1 px-3 rounded hover:bg-white"
                    >
                      Tất cả ({skillExercises.length})
                    </button>
                    {skillExercises.map((ex, idx) => (
                      <button
                        key={ex.id}
                        onClick={() => handleStartExercise(ex)}
                        className="w-full text-left text-sm py-1 px-3 rounded hover:bg-white text-gray-600"
                      >
                        Passage {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Skill Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b pb-4">
          {(Object.keys(SKILL_CONFIG) as Skill[]).map((skill) => {
            const config = SKILL_CONFIG[skill];
            const Icon = config.icon;
            return (
              <button
                key={skill}
                onClick={() => setActiveSkill(activeSkill === skill ? null : skill)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeSkill === skill
                    ? `${config.bgColor} ${config.color}`
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={!showCompleted ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCompleted(false)}
            >
              Bài chưa làm
            </Button>
            <Button
              variant={showCompleted ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCompleted(true)}
              className={showCompleted ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              Bài đã làm
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tên bài tập"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>

        {/* History Link */}
        <div className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-700">
          <Clock className="h-4 w-4" />
          <a href="#" className="text-sm font-medium">
            Xem lịch sử làm bài
          </a>
        </div>

        {/* Exercise Grid */}
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Không tìm thấy bài tập nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredExercises.map((exercise) => {
              const config = SKILL_CONFIG[exercise.skill];
              const isCompleted = completedExercises.includes(exercise.id);

              return (
                <div
                  key={exercise.id}
                  className="bg-white rounded-xl overflow-hidden border hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleStartExercise(exercise)}
                >
                  {/* Image */}
                  <div className="relative h-36 bg-gray-200">
                    <img
                      src={SKILL_IMAGES[exercise.id]}
                      alt={exercise.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* View count badge */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {getViewCount(exercise.id).toLocaleString()} lượt làm bài
                    </div>
                    {/* Passage badge */}
                    <Badge
                      className={`absolute bottom-2 left-2 ${config.bgColor} ${config.color} border-0`}
                    >
                      {config.label}
                    </Badge>
                    {/* Completed badge */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {exercise.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {exercise.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                      {exercise.questionCount && (
                        <span>{exercise.questionCount} câu hỏi</span>
                      )}
                      {exercise.minWords && <span>{exercise.minWords}+ từ</span>}
                      {exercise.duration && (
                        <span>{Math.floor(exercise.duration / 60)} phút</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Mode Selection Modal */}
      <ModeSelectionModal
        exercise={selectedExercise}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
