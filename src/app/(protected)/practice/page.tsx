'use client';

import { useState, useMemo } from 'react';
import { usePracticeStore } from '@/store/practice-store';
import { usePracticeExercises } from '@/hooks/use-practice-exercises';
import { ModeSelectionModal } from '@/components/practice/mode-selection-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Pencil, Headphones, Mic, Search, Clock, CheckCircle, Users } from 'lucide-react';
import type { Exercise, Skill } from '@/types/practice.types';

const SKILL_CONFIG = {
  reading: { icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-500', label: 'Reading' },
  listening: { icon: Headphones, color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-500', label: 'Listening' },
  writing: { icon: Pencil, color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-500', label: 'Writing' },
  speaking: { icon: Mic, color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-500', label: 'Speaking' },
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=200&fit=crop';
const SKILL_IMAGES: Record<string, string> = {
  'reading-1': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=200&fit=crop',
  'reading-2': 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=400&h=200&fit=crop',
  'writing-1': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=200&fit=crop',
  'listening-1': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=200&fit=crop',
  'speaking-1': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
};

export default function PracticePage() {
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const completedExercises = usePracticeStore((state) => state.completedExercises);
  const { exercises, loading, error, page, totalPages, setPage, retry } = usePracticeExercises(activeSkill);

  const filteredExercises = useMemo(() => {
    let list = exercises;
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
  }, [exercises, showCompleted, searchQuery, completedExercises]);

  const handleStartExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setModalOpen(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4 hidden lg:block">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Luyện tập</h2>
        <div className="space-y-1">
          <button
            onClick={() => setActiveSkill(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${activeSkill === null ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}
          >
            <span className="text-sm">Tất cả kỹ năng</span>
          </button>
          {(Object.keys(SKILL_CONFIG) as Skill[]).map((skill) => {
            const config = SKILL_CONFIG[skill];
            const Icon = config.icon;
            return (
              <button
                key={skill}
                onClick={() => setActiveSkill(activeSkill === skill ? null : skill)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeSkill === skill ? `${config.bgColor} ${config.color} font-semibold` : 'hover:bg-gray-50'}`}
              >
                <Icon className={`h-5 w-5 ${activeSkill === skill ? config.color : 'text-gray-400'}`} />
                <span className="text-sm">{config.label}</span>
              </button>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeSkill === skill ? `${config.bgColor} ${config.color}` : 'hover:bg-gray-100'}`}
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
            <Button variant={!showCompleted ? 'default' : 'outline'} size="sm" onClick={() => setShowCompleted(false)}>Bài chưa làm</Button>
            <Button variant={showCompleted ? 'default' : 'outline'} size="sm" onClick={() => setShowCompleted(true)} className={showCompleted ? 'bg-orange-500 hover:bg-orange-600' : ''}>Bài đã làm</Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Tìm theo tên bài tập" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-700">
          <Clock className="h-4 w-4" />
          <a href="#" className="text-sm font-medium">Xem lịch sử làm bài</a>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-56 animate-pulse" />
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
                return (
                  <div key={exercise.id} className="bg-white rounded-xl overflow-hidden border hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleStartExercise(exercise)}>
                    <div className="relative h-36 bg-gray-200">
                      <img src={SKILL_IMAGES[exercise.id] || DEFAULT_IMAGE} alt={exercise.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Users className="h-3 w-3" />1000 lượt làm bài
                      </div>
                      <Badge className={`absolute bottom-2 left-2 ${config.bgColor} ${config.color} border-0`}>{config.label}</Badge>
                      {isCompleted && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{exercise.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{exercise.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                        {exercise.questionCount && <span>{exercise.questionCount} câu hỏi</span>}
                        {exercise.minWords && <span>{exercise.minWords}+ từ</span>}
                        {exercise.duration && <span>{Math.floor(exercise.duration / 60)} phút</span>}
                      </div>
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
    </div>
  );
}
