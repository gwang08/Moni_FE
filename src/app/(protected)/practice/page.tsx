'use client';

import { useState, useMemo } from 'react';
import { SkillFilter } from '@/components/practice/skill-filter';
import { ExerciseGrid } from '@/components/practice/exercise-grid';
import { EXERCISES } from '@/data/exercises';
import type { Skill } from '@/types/practice.types';

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function PracticePage() {
  const [activeFilter, setActiveFilter] = useState<Skill | 'all'>('all');

  const shuffledExercises = useMemo(() => shuffle(EXERCISES), []);

  const filteredExercises = useMemo(() => {
    if (activeFilter === 'all') return shuffledExercises;
    return shuffledExercises.filter((e) => e.skill === activeFilter);
  }, [shuffledExercises, activeFilter]);

  const counts = useMemo(
    () => ({
      all: EXERCISES.length,
      reading: EXERCISES.filter((e) => e.skill === 'reading').length,
      writing: EXERCISES.filter((e) => e.skill === 'writing').length,
      listening: EXERCISES.filter((e) => e.skill === 'listening').length,
      speaking: EXERCISES.filter((e) => e.skill === 'speaking').length,
    }),
    []
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Luyện tập IELTS</h1>
          <p className="text-muted-foreground">
            Chọn kỹ năng và bắt đầu luyện tập
          </p>
        </div>

        {/* Filter */}
        <div className="mb-8">
          <SkillFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />
        </div>

        {/* Grid */}
        <ExerciseGrid exercises={filteredExercises} />
      </div>
    </div>
  );
}
