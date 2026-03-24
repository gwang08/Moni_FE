/** Writing Task 1 dạng đề options */
export const WRITING_TASK1_TYPES = [
  'Line Graph', 'Bar Chart', 'Pie Chart', 'Table', 'Mixed Graph', 'Map', 'Process',
];

/** Writing Task 2 dạng đề options */
export const WRITING_TASK2_TYPES = [
  'Agree or Disagree',
  'Discussion',
  'Advantages and Disadvantages',
  'Causes Problems and Solutions',
  'Two-Part Question',
  'Positive or Negative Development',
];

/** Writing Task 2 chủ đề options */
export const WRITING_TOPICS = [
  'Education',
  'Environment',
  'Work and Careers',
  'Government & Criminal Justice',
  'Science and Technology',
  'Health',
  'Entertainment',
  'Society and Culture',
  'Economics',
  'Other Topics',
  'Travel and Transportation',
];

/** Mapping: display label → questionTypeCode (for Task 1) */
export const WRITING_TASK1_TYPE_CODES: Record<string, string> = {
  'Line Graph': 'LINE_GRAPH',
  'Bar Chart': 'BAR_CHART',
  'Pie Chart': 'PIE_CHART',
  'Table': 'TABLE',
  'Mixed Graph': 'MIXED_GRAPH',
  'Map': 'MAP',
  'Process': 'PROCESS',
};

/** Mapping: display label → questionTypeCode (for Task 2) */
export const WRITING_TASK2_TYPE_CODES: Record<string, string> = {
  'Agree or Disagree': 'AGREE_DISAGREE',
  'Discussion': 'DISCUSSION',
  'Advantages and Disadvantages': 'ADVANTAGES_DISADVANTAGES',
  'Causes Problems and Solutions': 'CAUSES_PROBLEMS_SOLUTIONS',
  'Two-Part Question': 'TWO_PART_QUESTION',
  'Positive or Negative Development': 'POSITIVE_NEGATIVE',
};

/** Mapping: questionTypeCode → display label (combined Task 1 + Task 2) */
export const WRITING_TYPE_CODE_LABELS: Record<string, string> = {
  LINE_GRAPH: 'Line Graph',
  BAR_CHART: 'Bar Chart',
  PIE_CHART: 'Pie Chart',
  TABLE: 'Table',
  MIXED_GRAPH: 'Mixed Graph',
  MAP: 'Map',
  PROCESS: 'Process',
  AGREE_DISAGREE: 'Agree or Disagree',
  DISCUSSION: 'Discussion',
  ADVANTAGES_DISADVANTAGES: 'Advantages and Disadvantages',
  CAUSES_PROBLEMS_SOLUTIONS: 'Causes Problems and Solutions',
  TWO_PART_QUESTION: 'Two-Part Question',
  POSITIVE_NEGATIVE: 'Positive or Negative Development',
};
