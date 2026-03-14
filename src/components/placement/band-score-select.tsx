'use client';

// Reusable dropdown for selecting an IELTS band score from 0 to 9 in 0.5 steps
interface Props {
  value: number;
  onChange: (v: number) => void;
  label: string;
}

const BAND_OPTIONS = Array.from({ length: 19 }, (_, i) => i * 0.5);

export function BandScoreSelect({ value, onChange, label }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
      >
        {BAND_OPTIONS.map((band) => (
          <option key={band} value={band}>
            {band === 0 ? '0 - Chưa xác định' : band.toFixed(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
