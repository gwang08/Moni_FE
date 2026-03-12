'use client';

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
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 border-b">
        Ghi chú của bạn
      </h3>

      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Ghi ý tưởng, từ vựng, cấu trúc câu..."
        className="w-full h-64 text-sm text-gray-700 placeholder:text-gray-400 border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
      />

      <p className="text-xs text-gray-400 text-right">
        {notes.length}/{MAX_NOTES}
      </p>
    </div>
  );
}
