'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/store/user-store';
import { calculateOverallScore } from '@/lib/calendar-utils';
import type { SkillKey } from '@/types';

const SKILL_LABELS: Record<SkillKey, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

export function TargetScores() {
  const targetScores = useUserStore((state) => state.targetScores);
  const setTargetScore = useUserStore((state) => state.setTargetScore);

  const overallScore = calculateOverallScore(targetScores);

  const handleScoreChange = (skill: SkillKey, value: string) => {
    const score = parseFloat(value);
    if (!isNaN(score) && score >= 0 && score <= 9) {
      setTargetScore(skill, score);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Target Scores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(SKILL_LABELS) as SkillKey[]).map((skill) => (
          <div key={skill} className="flex items-center justify-between">
            <label htmlFor={skill} className="text-sm font-medium">
              {SKILL_LABELS[skill]}
            </label>
            <input
              id={skill}
              type="number"
              min="0"
              max="9"
              step="0.5"
              value={targetScores[skill]}
              onChange={(e) => handleScoreChange(skill, e.target.value)}
              className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        ))}
        <div className="pt-4 border-t flex items-center justify-between">
          <span className="text-sm font-semibold">Overall Score</span>
          <span className="text-2xl font-bold">{overallScore.toFixed(1)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
