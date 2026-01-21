import { ExerciseCard } from './exercise-card';
import type { Exercise } from '@/types/practice.types';

interface Props {
  exercises: Exercise[];
}

export function ExerciseGrid({ exercises }: Props) {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không có bài tập nào</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
}
