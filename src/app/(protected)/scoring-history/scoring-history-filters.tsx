'use client';

type SessionStatus = 'ALL' | 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type Skill = 'ALL' | 'SPEAKING' | 'WRITING';

export interface FilterState {
  status: SessionStatus;
  skill: Skill;
  sort: 'newest' | 'oldest';
}

const STATUS_OPTIONS: { value: SessionStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'QUEUED', label: 'Đang chờ' },
  { value: 'IN_PROGRESS', label: 'Đang diễn ra' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
];

const SKILL_OPTIONS: { value: Skill; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'SPEAKING', label: 'SPEAKING' },
  { value: 'WRITING', label: 'WRITING' },
];

export function ScoringHistoryFilters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  const set = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status filter */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {STATUS_OPTIONS.map(opt => (
          <button key={opt.value} type="button"
            onClick={() => set({ status: opt.value })}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${filters.status === opt.value ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Skill filter */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {SKILL_OPTIONS.map(opt => (
          <button key={opt.value} type="button"
            onClick={() => set({ skill: opt.value })}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${filters.skill === opt.value ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select value={filters.sort} onChange={e => set({ sort: e.target.value as 'newest' | 'oldest' })}
        className="text-xs border rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary">
        <option value="newest">Mới nhất</option>
        <option value="oldest">Cũ nhất</option>
      </select>
    </div>
  );
}
