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
  const difficulty: Difficulty = 'medium'; // backend doesn't have difficulty yet

  const base: Exercise = {
    id: test.id,
    skill,
    title: test.title,
    description: test.description || '',
    difficulty,
  };

  // Add skill-specific fields with defaults
  if (skill === 'reading' || skill === 'listening') {
    base.questionCount = 10;
  }
  if (skill === 'listening' || skill === 'speaking') {
    base.duration = skill === 'listening' ? 600 : 120;
  }
  if (skill === 'writing') {
    base.minWords = 250;
  }

  return base;
}
