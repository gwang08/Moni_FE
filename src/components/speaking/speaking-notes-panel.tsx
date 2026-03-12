'use client';

import { PenLine } from 'lucide-react';

const MAX_NOTES = 1000;

interface SpeakingNotesPanelProps {
  notes: string;
  onNotesChange: (value: string) => void;
}

export function SpeakingNotesPanel({ notes, onNotesChange }: SpeakingNotesPanelProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_NOTES) {
      onNotesChange(e.target.value);
    }
  };

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-orange-100/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-orange-100/40 bg-white/50 backdrop-blur-sm flex items-center gap-2">
        <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
          <PenLine className="h-3 w-3 text-orange-500" />
        </div>
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
          Ghi chú
        </h3>
      </div>

      {/* Textarea */}
      <div className="p-3">
        <textarea
          value={notes}
          onChange={handleChange}
          placeholder={'Ghi ý tưởng, từ vựng, cấu trúc câu...'}
          className="w-full h-60 text-sm text-gray-700 placeholder:text-gray-300 rounded-2xl border border-gray-200/60 bg-white/60 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-200 transition-all hover:border-orange-200/60 leading-relaxed"
        />

        {/* Character count pill */}
        <div className="flex justify-end mt-2">
          <span className="text-[11px] text-gray-400 bg-gray-50/80 px-2.5 py-0.5 rounded-full tabular-nums font-medium border border-gray-100/60">
            {notes.length}/{MAX_NOTES}
          </span>
        </div>
      </div>
    </div>
  );
}
