'use client';

import { useState } from 'react';
import { BookOpen, Headphones, Pencil, Mic } from 'lucide-react';
import Link from 'next/link';
import type { SkillKey } from '@/types';

const TABS: { key: SkillKey; label: string; icon: React.ReactNode }[] = [
  { key: 'writing', label: 'Writing', icon: <Pencil className="h-3.5 w-3.5" /> },
  { key: 'speaking', label: 'Speaking', icon: <Mic className="h-3.5 w-3.5" /> },
  { key: 'reading', label: 'Reading', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { key: 'listening', label: 'Listening', icon: <Headphones className="h-3.5 w-3.5" /> },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-5">
      {/* Placeholder illustration */}
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-inner">
        <div className="text-5xl select-none">📝</div>
      </div>
      <div className="text-center space-y-2 max-w-xs">
        <p className="text-sm text-gray-500 leading-relaxed">
          Bạn hiện chưa làm bài tập nào!<br />
          Hãy chọn dạng phù hợp và luyện tập ngay nào!
        </p>
      </div>
      <Link
        href="/practice"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-sm"
      >
        Tiến hành làm bài tập ngay
      </Link>
    </div>
  );
}

export function PracticeHistory() {
  const [activeTab, setActiveTab] = useState<SkillKey>('writing');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <h3 className="text-base font-semibold text-gray-800 mb-4">Lịch sử làm bài</h3>

      {/* Skill Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Sub-tab */}
      <div className="border-b border-gray-100 mb-4">
        <button className="pb-2 text-sm font-medium text-orange-500 border-b-2 border-orange-500 -mb-px">
          Theo tên bài
        </button>
      </div>

      {/* Content */}
      <EmptyState />
    </div>
  );
}
