'use client';

import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  hintText: string | null;
  defaultCollapsed?: boolean;
}

export function ExamHintPanel({ hintText, defaultCollapsed = false }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (!hintText) return null;

  return (
    <div className="w-72 flex-shrink-0 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50/30 shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between gap-2 bg-amber-100/80 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-bold text-amber-800">Gợi ý</span>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-amber-500" />
        ) : (
          <ChevronUp className="h-4 w-4 text-amber-500" />
        )}
      </button>
      {!collapsed && (
        <div className="px-4 py-3">
          <p className="whitespace-pre-line text-sm leading-relaxed text-amber-900/80">
            {hintText}
          </p>
        </div>
      )}
    </div>
  );
}
