const DEFAULT_NEUTRAL = 'border-slate-200 bg-slate-50 text-slate-700';

export const ADMIN_TEST_SKILL_BADGES: Record<string, string> = {
  READING: DEFAULT_NEUTRAL,
  LISTENING: DEFAULT_NEUTRAL,
  WRITING: DEFAULT_NEUTRAL,
  SPEAKING: DEFAULT_NEUTRAL,
};

export const ADMIN_TEST_TYPE_BADGES: Record<string, string> = {
  ACADEMIC: DEFAULT_NEUTRAL,
  GENERAL_TRAINING: DEFAULT_NEUTRAL,
  BOTH: DEFAULT_NEUTRAL,
  FULL_TEST: DEFAULT_NEUTRAL,
  PRACTICE: DEFAULT_NEUTRAL,
};

export const ADMIN_TEST_STATUS_BADGES: Record<string, string> = {
  DRAFT: 'border-yellow-200 bg-yellow-100 text-yellow-800',
  PUBLISHED: 'border-green-200 bg-green-100 text-green-800',
  HIDDEN: 'border-gray-200 bg-gray-100 text-gray-700',
};

export const ADMIN_TEST_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Sẵn sàng',
  HIDDEN: 'Ẩn',
};

export const ADMIN_TEST_TYPE_LABELS: Record<string, string> = {
  ACADEMIC: 'Academic',
  GENERAL_TRAINING: 'General',
  BOTH: 'Both',
  FULL_TEST: 'Full Test',
  PRACTICE: 'Practice',
};
