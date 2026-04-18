'use client';

import { Check, Sparkles, TriangleAlert, ArrowRight, Rocket } from 'lucide-react';
import type { NormalisedData } from './normalise';

interface Props {
  data: NormalisedData;
}

// 3 cột: Điểm mạnh · Cần cải thiện · Chiến lược bứt phá
// Ẩn cột nào không có data để tránh UI rỗng
export function ResultInsights({ data }: Props) {
  const strengthItems = splitLines(data.strengths);
  const improvementItems = getImprovementItems(data);
  const strategy = data.overall_strategy;

  if (!strengthItems.length && !improvementItems.length && !strategy) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {strengthItems.length > 0 && (
        <InsightCard
          icon={<Sparkles className="h-4 w-4 text-emerald-600" />}
          iconBg="bg-emerald-50"
          title="Điểm mạnh"
          items={strengthItems}
          itemIcon={<Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />}
        />
      )}
      {improvementItems.length > 0 && (
        <InsightCard
          icon={<TriangleAlert className="h-4 w-4 text-amber-600" />}
          iconBg="bg-amber-50"
          title="Cần cải thiện"
          items={improvementItems}
          itemIcon={<ArrowRight className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
        />
      )}
      {strategy && <StrategyCard text={strategy} />}
    </div>
  );
}

function InsightCard({
  icon,
  iconBg,
  title,
  items,
  itemIcon,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  items: string[];
  itemIcon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 h-full">
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-8 w-8 rounded-xl ${iconBg} grid place-items-center`}>{icon}</span>
        <h3 className="text-[14px] font-extrabold text-slate-900">{title}</h3>
      </div>
      <ul className="space-y-2.5 text-[13px] text-slate-700 leading-relaxed">
        {items.slice(0, 5).map((item, idx) => (
          <li key={idx} className="flex gap-2">
            {itemIcon}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StrategyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-sm h-full">
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-8 w-8 rounded-xl bg-white/20 grid place-items-center">
            <Rocket className="h-4 w-4 text-white" />
          </span>
          <h3 className="text-[14px] font-extrabold">Chiến lược bứt phá</h3>
        </div>
        <p className="text-[13px] leading-relaxed font-medium text-white/95 whitespace-pre-line">{text}</p>
      </div>
    </div>
  );
}

// Tách strengths string thành list bullet (xử lý cả "- ..." và xuống dòng)
function splitLines(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter((line) => line.length > 0);
}

// Lấy list cần cải thiện từ areasForImprovement string hoặc từ improvements array
function getImprovementItems(data: NormalisedData): string[] {
  const fromText = splitLines(data.feedbackImprovements);
  if (fromText.length) return fromText;

  return data.improvements
    .map((imp) => imp.reason)
    .filter((r): r is string => typeof r === 'string' && r.length > 0)
    .slice(0, 5);
}
