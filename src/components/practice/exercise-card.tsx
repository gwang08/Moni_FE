'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Pencil, Headphones, Mic, CheckCircle } from 'lucide-react';
import { usePracticeStore } from '@/store/practice-store';
import type { Exercise } from '@/types/practice.types';

const SKILL_CONFIG = {
  reading: { icon: BookOpen, color: 'bg-blue-500', label: 'Reading' },
  writing: { icon: Pencil, color: 'bg-green-500', label: 'Writing' },
  listening: { icon: Headphones, color: 'bg-purple-500', label: 'Listening' },
  speaking: { icon: Mic, color: 'bg-orange-500', label: 'Speaking' },
};

const DIFFICULTY_CONFIG = {
  easy: { label: 'Dễ', className: 'bg-green-100 text-green-800' },
  medium: { label: 'Trung bình', className: 'bg-yellow-100 text-yellow-800' },
  hard: { label: 'Khó', className: 'bg-red-100 text-red-800' },
};

interface Props {
  exercise: Exercise;
}

export function ExerciseCard({ exercise }: Props) {
  const isCompleted = usePracticeStore((state) =>
    state.completedExercises.includes(exercise.id)
  );

  const skillConfig = SKILL_CONFIG[exercise.skill];
  const difficultyConfig = DIFFICULTY_CONFIG[exercise.difficulty];
  const Icon = skillConfig.icon;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMetaInfo = () => {
    switch (exercise.skill) {
      case 'reading':
        return `${exercise.questionCount} câu hỏi`;
      case 'writing':
        return `${exercise.minWords}+ từ`;
      case 'listening':
        return formatDuration(exercise.duration!);
      case 'speaking':
        return `${Math.floor(exercise.duration! / 60)} phút`;
    }
  };

  return (
    <Card
      className={`relative overflow-hidden transition-shadow hover:shadow-lg ${
        isCompleted ? 'border-green-300 bg-green-50/30' : ''
      }`}
    >
      {/* Skill color bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${skillConfig.color}`} />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${skillConfig.color} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
        </div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {skillConfig.label}
        </p>
      </CardHeader>

      <CardContent className="pb-2">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">
          {exercise.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {exercise.description}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-2">
        <div className="flex items-center gap-2 w-full">
          <Badge variant="secondary" className={difficultyConfig.className}>
            {difficultyConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{getMetaInfo()}</span>
        </div>

        <Link
          href={`/practice/${exercise.skill}/${exercise.id}`}
          className="w-full"
        >
          <Button variant={isCompleted ? 'outline' : 'default'} className="w-full">
            {isCompleted ? 'Làm lại' : 'Bắt đầu'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
