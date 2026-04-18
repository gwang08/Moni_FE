'use client';

import { useState } from 'react';
import { ChevronDown, Microscope } from 'lucide-react';
import type { NormalisedCriterion } from './result-normalise';
import { bandTextColor } from './result-color-helpers';

interface Props {
  criteria: NormalisedCriterion[];
}

// Accordion gọn 4 tiêu chí — click để mở full justification + strengths/weaknesses
export function ResultCriteriaDetail({ criteria }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(criteria[0]?.key ?? null);

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[14px] font-extrabold text-slate-900 flex items-center gap-2">
          <Microscope className="h-4 w-4 text-teal-600" />
          Phân tích chi tiết theo tiêu chí
        </h3>
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Bấm để mở rộng</span>
      </div>
      <div className="divide-y divide-slate-100">
        {criteria.map((c) => (
          <CriterionRow
            key={c.key}
            criterion={c}
            isOpen={openKey === c.key}
            onToggle={() => setOpenKey(openKey === c.key ? null : c.key)}
          />
        ))}
      </div>
    </div>
  );
}

function CriterionRow({
  criterion: c,
  isOpen,
  onToggle,
}: {
  criterion: NormalisedCriterion;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const bgIcon = c.band >= 5 ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700';
  const briefJust = c.justification?.split('\n')[0] ?? 'Giám khảo chưa để lại nhận xét cho tiêu chí này.';

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors text-left"
      >
        <div className={`h-10 w-10 rounded-xl ${bgIcon} font-black grid place-items-center shrink-0`}>
          {c.key}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-extrabold text-slate-900">{c.label}</div>
          <div className="text-[12px] text-slate-500 font-medium truncate">{briefJust}</div>
        </div>
        <div className={`text-[18px] font-black ${bandTextColor(c.band)} tabular-nums shrink-0`}>
          {c.band.toFixed(1)}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pl-[72px] space-y-3">
          {c.justification ? (
            <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">{c.justification}</p>
          ) : (
            <p className="text-[12.5px] text-slate-400 italic">Không có nhận xét chi tiết.</p>
          )}
          {c.strengths && c.strengths.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Điểm mạnh</p>
              <ul className="space-y-1 text-[12.5px] text-slate-600 list-disc pl-4 marker:text-emerald-400">
                {c.strengths.slice(0, 3).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {c.weaknesses && c.weaknesses.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Hạn chế</p>
              <ul className="space-y-1 text-[12.5px] text-slate-600 list-disc pl-4 marker:text-amber-400">
                {c.weaknesses.slice(0, 3).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
