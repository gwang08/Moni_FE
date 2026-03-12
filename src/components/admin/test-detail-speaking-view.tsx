'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import type { StimulusDetail } from '@/types/test.types';

interface Props {
  stimuli: StimulusDetail[];
}

export function TestDetailSpeakingView({ stimuli }: Props) {
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const s = stimuli[0];
  if (!s) return <p className="text-gray-400 text-center py-8">Chưa có nội dung</p>;

  const questions = s.questionGroups[0]?.questions || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      {s.content && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Chủ đề Speaking</h3>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">{s.content}</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Danh sách câu hỏi <span className="text-xs font-normal text-gray-400">({questions.length} câu)</span>
        </h3>
        <div className="space-y-2">
          {questions.map((q) => {
            const hasSample = !!q.explanation?.text;
            const isOpen = expandedQ === q.id;
            return (
              <div key={q.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded shrink-0 mt-0.5">
                    {q.position}
                  </span>
                  <p className="text-sm text-gray-800 flex-1">{q.content}</p>
                  {hasSample && (
                    <button
                      type="button"
                      onClick={() => setExpandedQ(isOpen ? null : q.id)}
                      className="text-gray-400 hover:text-orange-500 shrink-0"
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                {isOpen && q.explanation?.text && (
                  <div className="mt-2 ml-8 text-sm text-gray-600 bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <p className="text-xs font-medium text-orange-600 mb-1 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> Gợi ý / Bài mẫu
                    </p>
                    {q.explanation.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
