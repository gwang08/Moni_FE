'use client';

import { WRITING_TASK1_TYPES, WRITING_TASK2_TYPES, WRITING_TOPICS } from './writing-filter-constants';

export interface WritingFilters {
  task: 1 | 2 | null;
  type: string | null;
  topic: string | null;
}

interface Props {
  filters: WritingFilters;
  onChange: (filters: WritingFilters) => void;
  activePassage: number | null;
}

export function WritingFiltersPanel({ filters, onChange, activePassage }: Props) {
  const { type, topic } = filters;
  // Sync task from sidebar (activePassage)
  const task = activePassage as 1 | 2 | null;

  const setType = (t: string | null) => onChange({ ...filters, type: t, task });
  const setTopic = (t: string | null) => onChange({ ...filters, topic: t, task });

  // Determine which types to show based on task selection
  const showAllTypes = task === null;

  return (
    <div className="space-y-3">
      {/* Dạng câu hỏi — All tasks combined */}
      {showAllTypes && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase shrink-0">Dạng câu hỏi:</span>
          <button
            onClick={() => setType(null)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              type === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          {[...WRITING_TASK1_TYPES, ...WRITING_TASK2_TYPES].map((t) => (
            <button
              key={t}
              onClick={() => setType(type === t ? null : t)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Dạng câu hỏi — Task 1 only */}
      {task === 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase shrink-0">Dạng câu hỏi:</span>
          <button
            onClick={() => setType(null)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              type === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          {WRITING_TASK1_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(type === t ? null : t)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Dạng câu hỏi + Chủ đề — Task 2 only */}
      {task === 2 && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase shrink-0">Dạng câu hỏi:</span>
            <button
              onClick={() => setType(null)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                type === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            {WRITING_TASK2_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(type === t ? null : t)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase shrink-0">Chủ đề:</span>
            <button
              onClick={() => setTopic(null)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                topic === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            {WRITING_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(topic === t ? null : t)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  topic === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
