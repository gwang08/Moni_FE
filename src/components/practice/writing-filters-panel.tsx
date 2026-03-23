'use client';

import { WRITING_TASK1_TYPES, WRITING_TASK2_TYPES, WRITING_TOPICS } from './writing-filter-constants';

export interface WritingFilters {
  task: 1 | 2 | null;
  types: string[];
  topics: string[];
}

/** A single checkbox row */
function FilterCheckbox({
  label, checked, onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-black/5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3.5 h-3.5 accent-gray-900 shrink-0"
      />
      <span className="text-sm text-gray-600">{label}</span>
    </label>
  );
}

/** A section heading inside the filter panel */
function FilterSectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-2">{label}</p>
  );
}

interface Props {
  filters: WritingFilters;
  onChange: (filters: WritingFilters) => void;
}

/** Writing filter panel: Task, Dạng đề, Chủ đề */
export function WritingFiltersPanel({ filters, onChange }: Props) {
  const { task, types, topics } = filters;

  const handleTask = (selected: 1 | 2) => {
    const next = task === selected ? null : selected;
    onChange({ task: next, types: [], topics: [] });
  };

  const toggleType = (type: string, checked: boolean) => {
    const next = checked ? [...types, type] : types.filter((t) => t !== type);
    onChange({ ...filters, types: next });
  };

  const toggleTopic = (topic: string, checked: boolean) => {
    const next = checked ? [...topics, topic] : topics.filter((t) => t !== topic);
    onChange({ ...filters, topics: next });
  };

  return (
    <div className="space-y-3">
      {/* Task selector */}
      <div>
        <FilterSectionLabel label="Task" />
        {([1, 2] as const).map((t) => (
          <FilterCheckbox
            key={t}
            label={`Task ${t}`}
            checked={task === t}
            onChange={() => handleTask(t)}
          />
        ))}
      </div>

      {/* Dạng đề — Task 1 */}
      {task === 1 && (
        <div>
          <FilterSectionLabel label="Dạng đề" />
          {WRITING_TASK1_TYPES.map((type) => (
            <FilterCheckbox
              key={type}
              label={type}
              checked={types.includes(type)}
              onChange={(checked) => toggleType(type, checked)}
            />
          ))}
        </div>
      )}

      {/* Dạng đề + Chủ đề — Task 2 */}
      {task === 2 && (
        <>
          <div>
            <FilterSectionLabel label="Dạng đề" />
            {WRITING_TASK2_TYPES.map((type) => (
              <FilterCheckbox
                key={type}
                label={type}
                checked={types.includes(type)}
                onChange={(checked) => toggleType(type, checked)}
              />
            ))}
          </div>
          <div>
            <FilterSectionLabel label="Chủ đề" />
            {WRITING_TOPICS.map((topic) => (
              <FilterCheckbox
                key={topic}
                label={topic}
                checked={topics.includes(topic)}
                onChange={(checked) => toggleTopic(topic, checked)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
