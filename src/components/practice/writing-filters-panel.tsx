'use client';

import { WRITING_TASK1_TYPES, WRITING_TASK2_TYPES, WRITING_TOPICS } from './writing-filter-constants';

export interface WritingFilters {
  task: 1 | 2 | null;
  types: string[];
  topics: string[];
}

function FilterRadio({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-black/5 cursor-pointer">
      <input type="radio" checked={checked} onChange={onChange} className="w-3.5 h-3.5 accent-gray-900 shrink-0" />
      <span className="text-sm text-gray-600">{label}</span>
    </label>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-black/5 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-3.5 h-3.5 accent-gray-900 shrink-0" />
      <span className="text-sm text-gray-600">{label}</span>
    </label>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-2">{label}</p>;
}

interface Props {
  filters: WritingFilters;
  onChange: (filters: WritingFilters) => void;
}

export function WritingFiltersPanel({ filters, onChange }: Props) {
  const { task, types, topics } = filters;

  const setTask = (t: 1 | 2 | null) => onChange({ task: t, types: [], topics: [] });

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
      {/* Task selector — radio */}
      <div>
        <SectionLabel label="Task" />
        <FilterRadio label="Tất cả" checked={task === null} onChange={() => setTask(null)} />
        <FilterRadio label="Task 1" checked={task === 1} onChange={() => setTask(1)} />
        <FilterRadio label="Task 2" checked={task === 2} onChange={() => setTask(2)} />
      </div>

      {/* Dạng đề — Task 1 */}
      {task === 1 && (
        <div>
          <SectionLabel label="Dạng đề" />
          {WRITING_TASK1_TYPES.map((type) => (
            <FilterCheckbox key={type} label={type} checked={types.includes(type)} onChange={(c) => toggleType(type, c)} />
          ))}
        </div>
      )}

      {/* Dạng đề + Chủ đề — Task 2 */}
      {task === 2 && (
        <>
          <div>
            <SectionLabel label="Dạng đề" />
            {WRITING_TASK2_TYPES.map((type) => (
              <FilterCheckbox key={type} label={type} checked={types.includes(type)} onChange={(c) => toggleType(type, c)} />
            ))}
          </div>
          <div>
            <SectionLabel label="Chủ đề" />
            {WRITING_TOPICS.map((topic) => (
              <FilterCheckbox key={topic} label={topic} checked={topics.includes(topic)} onChange={(c) => toggleTopic(topic, c)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
