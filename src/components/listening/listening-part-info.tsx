'use client';

interface Props {
  section: number;
  questionRange: string;
  instruction?: string;
}

export function ListeningPartInfo({ section, questionRange, instruction }: Props) {
  return (
    <div className="rounded-lg border border-gray-300 bg-[#f4f4f0] px-4 py-3 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-bold text-gray-900">Part {section}</span>
      </div>
      <p className="text-sm text-gray-700">
        Listen and answer questions {questionRange}.
      </p>
      {instruction && (
        <p className="text-sm text-gray-700 mt-2 italic">
          {instruction}
        </p>
      )}
    </div>
  );
}
