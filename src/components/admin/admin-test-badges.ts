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

export const ADMIN_QUESTION_TYPE_LABELS: Record<string, string> = {
  MCQ: 'Trắc nghiệm (1)',
  MCQ_MULTIPLE: 'Trắc nghiệm (Nhiều)',
  TFNG: 'True/False/Not Given',
  YNNG: 'Yes/No/Not Given',
  MATCHING_HEADINGS: 'Nối tiêu đề',
  MATCHING_INFORMATION: 'Nối thông tin',
  MATCHING_FEATURE: 'Nối đặc điểm',
  DIAGRAM_LABEL: 'Nhãn sơ đồ',
  GAP_FILLING: 'Điền từ',
  SHORT_ANSWER: 'Trả lời ngắn',
  SPEAKING_PART_1: 'Part 1',
  SPEAKING_PART_2: 'Part 2',
  SPEAKING_PART_3: 'Part 3',
  WRITING_TASK_1: 'Task 1',
  WRITING_TASK_2: 'Task 2',
  LINE_GRAPH: 'Biểu đồ đường',
  BAR_CHART: 'Biểu đồ cột',
  PIE_CHART: 'Biểu đồ tròn',
  TABLE: 'Bảng biểu',
  MIXED_GRAPH: 'Biểu đồ kết hợp',
  MAP: 'Bản đồ',
  PROCESS: 'Quy trình',
  AGREE_DISAGREE: 'Agree/Disagree',
  DISCUSSION: 'Discussion',
  ADVANTAGES_DISADVANTAGES: 'Advantages/Disadvantages',
  CAUSES_PROBLEMS_SOLUTIONS: 'Causes/Problems/Solutions',
  TWO_PART_QUESTION: 'Two-part Question',
  POSITIVE_NEGATIVE: 'Positive/Negative',
};
