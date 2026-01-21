import type { Exercise } from '@/types/practice.types';

export const EXERCISES: Exercise[] = [
  // READING (3)
  {
    id: 'reading-1',
    skill: 'reading',
    title: 'The History of Coffee',
    description: 'Origins and spread of coffee cultivation worldwide',
    difficulty: 'medium',
    questionCount: 14,
  },
  {
    id: 'reading-2',
    skill: 'reading',
    title: 'Climate Change Effects',
    description: 'Impact of global warming on ecosystems',
    difficulty: 'hard',
    questionCount: 13,
  },
  {
    id: 'reading-3',
    skill: 'reading',
    title: 'Urban Transportation',
    description: 'Evolution of public transport systems',
    difficulty: 'easy',
    questionCount: 10,
  },

  // WRITING (3)
  {
    id: 'writing-1',
    skill: 'writing',
    title: 'Public Health & Sports',
    description: 'Discuss sports facilities impact on public health',
    difficulty: 'hard',
    minWords: 250,
  },
  {
    id: 'writing-2',
    skill: 'writing',
    title: 'Technology in Education',
    description: 'Benefits and drawbacks of online learning',
    difficulty: 'medium',
    minWords: 250,
  },
  {
    id: 'writing-3',
    skill: 'writing',
    title: 'Environmental Protection',
    description: 'Individual vs government responsibility',
    difficulty: 'easy',
    minWords: 250,
  },

  // LISTENING (3)
  {
    id: 'listening-1',
    skill: 'listening',
    title: 'University Accommodation',
    description: 'Student inquiring about halls of residence',
    difficulty: 'easy',
    duration: 510,
    questionCount: 10,
  },
  {
    id: 'listening-2',
    skill: 'listening',
    title: 'Travel Agency Booking',
    description: 'Customer booking a holiday package',
    difficulty: 'medium',
    duration: 405,
    questionCount: 10,
  },
  {
    id: 'listening-3',
    skill: 'listening',
    title: 'Academic Lecture',
    description: 'Professor discussing renewable energy',
    difficulty: 'hard',
    duration: 720,
    questionCount: 10,
  },

  // SPEAKING (3)
  {
    id: 'speaking-1',
    skill: 'speaking',
    title: 'Describe a Person',
    description: 'Talk about someone who influenced you',
    difficulty: 'medium',
    duration: 120,
  },
  {
    id: 'speaking-2',
    skill: 'speaking',
    title: 'Favorite Place',
    description: 'Describe a place you like to visit',
    difficulty: 'easy',
    duration: 120,
  },
  {
    id: 'speaking-3',
    skill: 'speaking',
    title: 'Future Plans',
    description: 'Discuss your career aspirations',
    difficulty: 'hard',
    duration: 120,
  },
];

export const getExerciseById = (id: string): Exercise | undefined => {
  return EXERCISES.find((e) => e.id === id);
};

export const getExercisesBySkill = (skill: string): Exercise[] => {
  return EXERCISES.filter((e) => e.skill === skill);
};
