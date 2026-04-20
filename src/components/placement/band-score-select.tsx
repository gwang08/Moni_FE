'use client';

import { PenLine, Mic } from 'lucide-react';

interface Props {
  value: number;
  onChange: (v: number) => void;
  label: string;
}

const BAND_OPTIONS = Array.from({ length: 19 }, (_, i) => i * 0.5);

const SKILL_CONFIG: Record<string, { icon: typeof PenLine; color: string; bg: string; border: string }> = {
  Writing: { icon: PenLine, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200 focus-within:border-emerald-400 focus-within:ring-emerald-100' },
  Speaking: { icon: Mic, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200 focus-within:border-orange-400 focus-within:ring-orange-100' },
};

function getBandLabel(band: number): string {
  if (band === 0) return 'Chưa xác định';
  if (band <= 2) return 'Sơ cấp';
  if (band <= 4) return 'Cơ bản';
  if (band <= 5.5) return 'Trung cấp';
  if (band <= 6.5) return 'Trung cao';
  if (band <= 7.5) return 'Khá giỏi';
  if (band <= 8.5) return 'Giỏi';
  return 'Xuất sắc';
}

export function BandScoreSelect({ value, onChange, label }: Props) {
  const config = SKILL_CONFIG[label] || SKILL_CONFIG.Writing;
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-1.5 ${config.bg}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <label className="text-sm font-semibold text-gray-800">{label}</label>
        {value > 0 && (
          <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
            {getBandLabel(value)}
          </span>
        )}
      </div>
      <div className={`relative rounded-xl border-2 transition-all focus-within:ring-2 ${config.border}`}>
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full appearance-none bg-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none cursor-pointer"
        >
          {BAND_OPTIONS.map((band) => (
            <option key={band} value={band}>
              {band === 0 ? '0 — Chưa xác định' : `${band.toFixed(1)} — ${getBandLabel(band)}`}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
