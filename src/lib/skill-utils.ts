import type { Exercise, Skill, Difficulty } from '@/types/practice.types';
import type { TestResponse } from '@/types/test.types';

const SKILL_MAP: Record<string, Skill> = {
  READING: 'reading',
  WRITING: 'writing',
  LISTENING: 'listening',
  SPEAKING: 'speaking',
};

export function backendSkillToFrontend(skill: string): Skill {
  return SKILL_MAP[skill.toUpperCase()] || 'reading';
}

export function testResponseToExercise(test: TestResponse): Exercise {
  const skill = backendSkillToFrontend(test.skill);
  const difficulty: Difficulty = 'medium';

  return {
    id: String(test.id),
    skill,
    title: test.title,
    description: test.description || '',
    difficulty,
    questionCount: test.questionCount ?? 0,
    duration: test.duration ? test.duration * 60 : undefined,
    thumbnailUrl: test.thumbnailUrl,
    attemptCount: test.attemptCount ?? 0,
    questionTypes: test.questionTypes ?? [],
  };
}
