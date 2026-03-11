'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/user-store';
import { calculateOverallScore } from '@/lib/calendar-utils';
import type { SkillKey } from '@/types';
import { Pencil, Check, X } from 'lucide-react';

const SKILL_LABELS: Record<SkillKey, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
};

const SKILL_COLORS: Record<SkillKey, string> = {
  reading: 'bg-blue-50 border-blue-200 text-blue-700',
  listening: 'bg-purple-50 border-purple-200 text-purple-700',
  writing: 'bg-green-50 border-green-200 text-green-700',
  speaking: 'bg-pink-50 border-pink-200 text-pink-700',
};

const SKILLS: SkillKey[] = ['reading', 'listening', 'writing', 'speaking'];

export function TargetScores() {
  const targetScores = useUserStore((s) => s.targetScores);
  const setTargetScore = useUserStore((s) => s.setTargetScore);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<SkillKey, string>>({
    reading: '',
    listening: '',
    writing: '',
    speaking: '',
  });

  // Compute overall from draft (live) when editing, from store otherwise
  const liveScores = editing
    ? { reading: parseFloat(draft.reading) || 0, listening: parseFloat(draft.listening) || 0, writing: parseFloat(draft.writing) || 0, speaking: parseFloat(draft.speaking) || 0 }
    : targetScores;
  const hasScores = SKILLS.some((k) => liveScores[k] > 0);
  const overallScore = hasScores ? calculateOverallScore(liveScores) : null;

  const startEdit = () => {
    setDraft({
      reading: targetScores.reading ? String(targetScores.reading) : '',
      listening: targetScores.listening ? String(targetScores.listening) : '',
      writing: targetScores.writing ? String(targetScores.writing) : '',
      speaking: targetScores.speaking ? String(targetScores.speaking) : '',
    });
    setEditing(true);
  };

  const saveEdit = () => {
    SKILLS.forEach((skill) => {
      const val = parseFloat(draft[skill]);
      if (!isNaN(val) && val >= 0 && val <= 9) {
        setTargetScore(skill, val);
      } else if (draft[skill] === '') {
        setTargetScore(skill, 0);
      }
    });
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-800">Mục tiêu của bạn</h3>
        {!editing ? (
          <button
            onClick={startEdit}
            className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors"
            title="Chỉnh sửa mục tiêu"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={saveEdit}
              className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Overall Score Badge */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Overall</span>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold text-white">
              {overallScore !== null ? overallScore.toFixed(1) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Skill Boxes */}
      <div className="grid grid-cols-2 gap-3">
        {SKILLS.map((skill) => (
          <div
            key={skill}
            className={`rounded-xl border p-3 ${SKILL_COLORS[skill]}`}
          >
            <p className="text-xs font-medium opacity-70 mb-1">{SKILL_LABELS[skill]}</p>
            {editing ? (
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={draft[skill]}
                onChange={(e) => setDraft((d) => ({ ...d, [skill]: e.target.value }))}
                placeholder="0–9"
                className="w-full text-lg font-bold bg-white/70 rounded-lg px-2 py-0.5 border border-current/20 outline-none focus:ring-1 focus:ring-current"
              />
            ) : (
              <p className="text-xl font-bold">
                {targetScores[skill] > 0 ? targetScores[skill].toFixed(1) : '—'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
