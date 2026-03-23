'use client';

import { useState } from 'react';
import { BookOpen, Pencil, Headphones, Mic } from 'lucide-react';
import type { Skill, TestMode } from '@/types/practice.types';
import { WritingFiltersPanel } from './writing-filters-panel';
import type { WritingFilters } from './writing-filters-panel';

export type { WritingFilters };

const SKILLS = [
  {
    key: 'reading' as Skill,
    label: 'Reading',
    icon: BookOpen,
    color: 'text-blue-600',
    modes: ['PRACTICE', 'FULL_TEST'] as TestMode[],
    subItems: ['Passage 1', 'Passage 2', 'Passage 3'],
  },
  {
    key: 'listening' as Skill,
    label: 'Listening',
    icon: Headphones,
    color: 'text-orange-500',
    modes: ['PRACTICE', 'FULL_TEST'] as TestMode[],
    subItems: ['Section 1', 'Section 2', 'Section 3', 'Section 4'],
  },
  {
    key: 'writing' as Skill,
    label: 'Writing',
    icon: Pencil,
    color: 'text-red-500',
    modes: ['PRACTICE'] as TestMode[],
    subItems: [],
  },
  {
    key: 'speaking' as Skill,
    label: 'Speaking',
    icon: Mic,
    color: 'text-teal-500',
    modes: ['PRACTICE', 'FULL_TEST'] as TestMode[],
    subItems: ['Part 1', 'Part 2', 'Part 3'],
  },
];

const MODE_LABELS: Record<TestMode, string> = {
  PRACTICE: 'Bài lẻ',
  FULL_TEST: 'Full đề',
};

interface Props {
  activeSkill: Skill;
  activeMode: TestMode;
  activePassage: number | null;
  onSkillChange: (skill: Skill) => void;
  onModeChange: (mode: TestMode) => void;
  onPassageChange: (passage: number | null) => void;
  onWritingFiltersChange?: (filters: WritingFilters) => void;
}

export function PracticeSidebar({
  activeSkill, activeMode, activePassage,
  onSkillChange, onModeChange, onPassageChange,
  onWritingFiltersChange,
}: Props) {
  const [writingFilters, setWritingFilters] = useState<WritingFilters>({
    task: null, types: [], topics: [],
  });

  const handleWritingFiltersChange = (filters: WritingFilters) => {
    setWritingFilters(filters);
    onWritingFiltersChange?.(filters);
  };

  const handleSelect = (skill: Skill, mode: TestMode) => {
    if (activeSkill !== skill) onSkillChange(skill);
    onModeChange(mode);
    onPassageChange(null);
  };

  const handlePassage = (skill: Skill, passage: number) => {
    if (activeSkill !== skill) onSkillChange(skill);
    onModeChange('PRACTICE');
    onPassageChange(activePassage === passage ? null : passage);
  };

  return (
    <aside className="w-64 bg-gray-50/50 border-r p-4 hidden lg:block overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Luyện tập</h2>
      <div className="space-y-3">
        {SKILLS.map((skill) => {
          const isActive = activeSkill === skill.key;
          const Icon = skill.icon;

          return (
            <div
              key={skill.key}
              className={`rounded-xl border-2 transition-all ${
                isActive ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200'
              }`}
            >
              {/* Skill header */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-gray-100">
                <Icon className={`h-5 w-5 ${skill.color}`} />
                <span className="font-semibold text-sm text-gray-900">{skill.label}</span>
              </div>

              {/* Modes always visible */}
              <div className="px-3 py-2.5 space-y-1">
                {skill.modes.map((mode) => {
                  const isSelected = isActive && activeMode === mode;

                  return (
                    <div key={mode}>
                      <button
                        onClick={() => handleSelect(skill.key, mode)}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-black/5 transition-colors"
                      >
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-gray-900' : 'border-gray-300'
                        }`}>
                          {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                        </span>
                        <span className={`text-sm ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                          {MODE_LABELS[mode]}
                        </span>
                      </button>

                      {/* Sub-items for Reading/Listening/Speaking bài lẻ */}
                      {isSelected && mode === 'PRACTICE' && skill.subItems.length > 0 && (
                        <div className="ml-7 pl-3 border-l-2 border-gray-300 space-y-0.5 mt-0.5 mb-1">
                          {skill.subItems.map((item, idx) => {
                            const pNum = idx + 1;
                            const isPActive = activePassage === pNum;
                            return (
                              <button
                                key={idx}
                                onClick={() => handlePassage(skill.key, pNum)}
                                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-black/5 transition-colors"
                              >
                                <span className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isPActive ? 'border-gray-900' : 'border-gray-300'
                                }`}>
                                  {isPActive && <span className="w-2 h-2 rounded-full bg-gray-900" />}
                                </span>
                                <span className={`text-sm ${isPActive ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                  {item}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Writing filters */}
                      {isSelected && skill.key === 'writing' && (
                        <div className="ml-7 pl-3 border-l-2 border-gray-300 mt-1 mb-1">
                          <WritingFiltersPanel
                            filters={writingFilters}
                            onChange={handleWritingFiltersChange}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
