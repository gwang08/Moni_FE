'use client';

import { BookOpen, Pencil, Headphones, Mic, ChevronRight } from 'lucide-react';
import type { Skill, TestMode } from '@/types/practice.types';

const SKILLS = [
  {
    key: 'reading' as Skill,
    label: 'Reading',
    icon: BookOpen,
    gradient: 'from-blue-500 to-indigo-500',
    activeBg: 'bg-blue-50',
    activeBorder: 'border-blue-400',
    iconColor: 'text-blue-600',
    dotColor: 'bg-blue-600',
    dotBorder: 'border-blue-600',
    modes: ['PRACTICE', 'FULL_TEST'] as TestMode[],
    subItems: ['Passage 1', 'Passage 2', 'Passage 3'],
  },
  {
    key: 'listening' as Skill,
    label: 'Listening',
    icon: Headphones,
    gradient: 'from-purple-500 to-violet-500',
    activeBg: 'bg-purple-50',
    activeBorder: 'border-purple-400',
    iconColor: 'text-purple-600',
    dotColor: 'bg-purple-600',
    dotBorder: 'border-purple-600',
    modes: ['PRACTICE', 'FULL_TEST'] as TestMode[],
    subItems: ['Section 1', 'Section 2', 'Section 3', 'Section 4'],
  },
  {
    key: 'writing' as Skill,
    label: 'Writing',
    icon: Pencil,
    gradient: 'from-emerald-500 to-teal-500',
    activeBg: 'bg-emerald-50',
    activeBorder: 'border-emerald-400',
    iconColor: 'text-emerald-600',
    dotColor: 'bg-emerald-600',
    dotBorder: 'border-emerald-600',
    modes: ['PRACTICE', 'FULL_TEST'] as TestMode[],
    subItems: ['Task 1', 'Task 2'],
  },
  {
    key: 'speaking' as Skill,
    label: 'Speaking',
    icon: Mic,
    gradient: 'from-orange-500 to-amber-500',
    activeBg: 'bg-orange-50',
    activeBorder: 'border-orange-400',
    iconColor: 'text-orange-600',
    dotColor: 'bg-orange-600',
    dotBorder: 'border-orange-600',
    modes: ['PRACTICE', 'FULL_TEST'] as TestMode[],
    subItems: ['Part 1', 'Part 2', 'Part 3'],
  },
];

const MODE_LABELS: Record<TestMode, string> = {
  PRACTICE: 'Phần thi',
  FULL_TEST: 'Bài thi',
};

interface Props {
  activeSkill: Skill;
  activeMode: TestMode;
  activePassage: number | null;
  onSkillChange: (skill: Skill) => void;
  onModeChange: (mode: TestMode) => void;
  onPassageChange: (passage: number | null) => void;
  onWritingTaskChange?: (task: 1 | 2 | null) => void;
}

export function PracticeSidebar({
  activeSkill, activeMode, activePassage,
  onSkillChange, onModeChange, onPassageChange, onWritingTaskChange,
}: Props) {

  const handleSelect = (skill: Skill, mode: TestMode) => {
    if (activeSkill !== skill) onSkillChange(skill);
    onModeChange(mode);
  };

  const handlePassage = (skill: Skill, passage: number) => {
    if (activeSkill !== skill) onSkillChange(skill);
    if (skill === 'writing' && onWritingTaskChange) {
      onWritingTaskChange(activePassage === passage ? null : (passage as 1 | 2));
    } else {
      onPassageChange(activePassage === passage ? null : passage);
    }
  };

  return (
    <aside className="w-[260px] bg-white border-r border-slate-100 hidden lg:flex flex-col sticky top-[56px] max-h-[calc(100vh-56px)]">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-[15px] font-extrabold text-slate-800 tracking-tight">Luyện tập</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
        {SKILLS.map((skill) => {
          const isActive = activeSkill === skill.key;
          const Icon = skill.icon;

          return (
            <div key={skill.key} className="rounded-xl overflow-hidden">
              {/* Skill header */}
              <button
                onClick={() => { if (!isActive) onSkillChange(skill.key); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 transition-all ${
                  isActive
                    ? `${skill.activeBg} border-l-[3px] ${skill.activeBorder}`
                    : 'hover:bg-slate-50 border-l-[3px] border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive ? `bg-gradient-to-br ${skill.gradient} text-white shadow-sm` : 'bg-slate-100 text-slate-500'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[13.5px] font-bold flex-1 text-left ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                  {skill.label}
                </span>
                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isActive ? 'rotate-90 text-slate-500' : 'text-slate-300'}`} />
              </button>

              {/* Expanded content */}
              {isActive && (
                <div className="pl-5 pr-2 pb-2 pt-1 space-y-0.5">
                  {skill.modes.map((mode) => {
                    const isSelected = activeMode === mode;

                    return (
                      <div key={mode}>
                        <button
                          onClick={() => handleSelect(skill.key, mode)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                            isSelected ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-white/60'
                          }`}
                        >
                          <span className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? skill.dotBorder : 'border-slate-300'
                          }`}>
                            {isSelected && <span className={`w-2 h-2 rounded-full ${skill.dotColor}`} />}
                          </span>
                          <span className={`text-[13px] ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                            {MODE_LABELS[mode]}
                          </span>
                        </button>

                        {/* Sub-items */}
                        {isSelected && mode === 'PRACTICE' && skill.subItems.length > 0 && (
                          <div className="ml-6 pl-3 border-l-2 border-slate-200 space-y-0.5 mt-0.5 mb-1">
                            {skill.subItems.map((item, idx) => {
                              const pNum = idx + 1;
                              const isPActive = activePassage === pNum;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handlePassage(skill.key, pNum)}
                                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                                    isPActive ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-white/60'
                                  }`}
                                >
                                  <span className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    isPActive ? skill.dotBorder : 'border-slate-300'
                                  }`}>
                                    {isPActive && <span className={`w-1.5 h-1.5 rounded-full ${skill.dotColor}`} />}
                                  </span>
                                  <span className={`text-[12.5px] ${isPActive ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                                    {item}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
