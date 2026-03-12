import type { QuestionTypeCode, OptionRequest } from '@/types/admin.types';

export function defaultOptions(type: QuestionTypeCode): OptionRequest[] {
  if (type === 'TFNG') return [
    { label: 'TRUE', content: 'TRUE', isCorrect: true },
    { label: 'FALSE', content: 'FALSE', isCorrect: false },
    { label: 'NOT GIVEN', content: 'NOT GIVEN', isCorrect: false },
  ];
  if (type === 'YNNG') return [
    { label: 'YES', content: 'YES', isCorrect: true },
    { label: 'NO', content: 'NO', isCorrect: false },
    { label: 'NOT GIVEN', content: 'NOT GIVEN', isCorrect: false },
  ];
  if (type === 'GAP_FILLING' || type === 'DIAGRAM_LABEL') return [{ content: '', isCorrect: true }];
  return [
    { label: 'A', content: '', isCorrect: true },
    { label: 'B', content: '', isCorrect: false },
    { label: 'C', content: '', isCorrect: false },
    { label: 'D', content: '', isCorrect: false },
  ];
}
