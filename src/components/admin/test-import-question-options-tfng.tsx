'use client';

import type { OptionRequest } from '@/types/admin.types';

interface Props {
  options: OptionRequest[];
  onChange: (options: OptionRequest[]) => void;
  variant: 'TFNG' | 'YNNG';
}

const TFNG_LABELS = ['True', 'False', 'Not Given'];
const YNNG_LABELS = ['Yes', 'No', 'Not Given'];

export function defaultTfngOptions(variant: 'TFNG' | 'YNNG'): OptionRequest[] {
  const labels = variant === 'TFNG' ? TFNG_LABELS : YNNG_LABELS;
  return labels.map(label => ({ label, content: label, isCorrect: false }));
}

export function TfngOptions({ options, onChange, variant }: Props) {
  const labels = variant === 'TFNG' ? TFNG_LABELS : YNNG_LABELS;

  const setCorrect = (idx: number) =>
    onChange(options.map((o, i) => ({ ...o, isCorrect: i === idx })));

  return (
    <div className="space-y-2">
      {options.map((option, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="radio"
            name={`tfng-${variant}-${idx}`}
            checked={option.isCorrect}
            onChange={() => setCorrect(idx)}
            className="mt-0.5"
          />
          <span className="text-sm font-medium text-gray-700">{labels[idx]}</span>
        </div>
      ))}
    </div>
  );
}
