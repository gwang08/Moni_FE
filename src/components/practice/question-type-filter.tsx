'use client';

import { Filter } from 'lucide-react';

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MCQ: 'Multiple Choice',
  MCQ_MULTIPLE: 'Multiple Choice',
  TFNG: 'True / False / Not Given',
  YNNG: 'Yes / No / Not Given',
  MATCHING_HEADINGS: 'Matching Headings',
  MATCHING_INFORMATION: 'Matching Information',
  MATCHING_FEATURE: 'Matching Features',
  DIAGRAM_LABEL: 'Map, Diagram Label',
  GAP_FILLING: 'Gap Filling',
  SPEAKING_PART_1: 'Part 1',
  SPEAKING_PART_2: 'Part 2',
  SPEAKING_PART_3: 'Part 3',
};

interface Props {
  availableTypes: string[];
  activeType: string | null;
  onTypeChange: (type: string | null) => void;
}

export function QuestionTypeFilter({ availableTypes, activeType, onTypeChange }: Props) {
  if (availableTypes.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      <Filter className="h-4 w-4 text-gray-400 shrink-0" />
      <button
        onClick={() => onTypeChange(null)}
        className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
          !activeType ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Tất cả
      </button>
      {availableTypes.map((qt) => (
        <button
          key={qt}
          onClick={() => onTypeChange(activeType === qt ? null : qt)}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
            activeType === qt ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {QUESTION_TYPE_LABELS[qt] || qt}
        </button>
      ))}
    </div>
  );
}
