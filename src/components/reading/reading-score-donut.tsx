'use client';

interface Props {
  correct: number;
  wrong: number;
  total: number;
}

/** SVG donut chart showing correct/wrong/skipped counts */
export function ReadingScoreDonut({ correct, wrong, total }: Props) {
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const correctPct = total > 0 ? correct / total : 0;
  const wrongPct = total > 0 ? wrong / total : 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background (skipped) */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}
        />
        {/* Wrong (red) segment */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#ef4444" strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - correctPct - wrongPct)}
          strokeLinecap="round"
        />
        {/* Correct (green) segment on top */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#22c55e" strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * correctPct} ${circumference * (1 - correctPct)}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold">{correct}/{total}</p>
        <p className="text-sm text-muted-foreground">câu đúng</p>
      </div>
    </div>
  );
}
