'use client';

import { Button } from '@/components/ui/button';
import { BookOpen, Pencil, Headphones, Mic } from 'lucide-react';
import type { Skill } from '@/types/practice.types';

interface Props {
  activeFilter: Skill | 'all';
  onFilterChange: (filter: Skill | 'all') => void;
  counts: Record<Skill | 'all', number>;
}

const FILTERS = [
  { key: 'all' as const, label: 'Tất cả', icon: null },
  { key: 'reading' as const, label: 'Reading', icon: BookOpen },
  { key: 'writing' as const, label: 'Writing', icon: Pencil },
  { key: 'listening' as const, label: 'Listening', icon: Headphones },
  { key: 'speaking' as const, label: 'Speaking', icon: Mic },
];

export function SkillFilter({ activeFilter, onFilterChange, counts }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={activeFilter === key ? 'default' : 'outline'}
          onClick={() => onFilterChange(key)}
          className="gap-2"
        >
          {Icon && <Icon className="h-4 w-4" />}
          {label}
          <span className="ml-1 text-xs opacity-70">({counts[key]})</span>
        </Button>
      ))}
    </div>
  );
}
