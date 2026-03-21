'use client';

import type { EvaluationEvent } from '@/types/speaking-exam.types';

interface Props {
  evaluation: EvaluationEvent;
}

const CRITERIA = [
  { key: 'fluency', label: 'Fluency & Coherence' },
  { key: 'vocabulary', label: 'Lexical Resource' },
  { key: 'grammar', label: 'Grammatical Range & Accuracy' },
  { key: 'pronunciation', label: 'Pronunciation' },
] as const;

function bandColor(score: number): string {
  if (score >= 7.5) return 'text-blue-600 bg-blue-50';
  if (score >= 6.5) return 'text-green-600 bg-green-50';
  if (score >= 5.0) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export function ExamEvaluationResult({ evaluation }: Props) {
  const { feedback } = evaluation;

  return (
    <div className="space-y-8">
      {/* Overall band */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-gray-500">Điểm tổng</p>
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full text-4xl font-bold ${bandColor(evaluation.final_band)}`}
        >
          {evaluation.final_band}
        </div>
      </div>

      {/* Criteria scores */}
      <div className="grid grid-cols-2 gap-3">
        {CRITERIA.map(({ key, label }) => {
          const score = evaluation[key];
          return (
            <div key={key} className="rounded-lg border p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-2xl font-bold ${bandColor(score)}`}>{score}</p>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="space-y-4 rounded-xl border bg-gray-50 p-6">
          {feedback.summary && (
            <p className="leading-relaxed text-gray-700">{feedback.summary}</p>
          )}

          {feedback.strengths?.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-green-700">Điểm mạnh</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                {feedback.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.areas_for_improvement?.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-orange-700">Cần cải thiện</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                {feedback.areas_for_improvement.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.next_steps?.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-blue-700">Bước tiếp theo</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                {feedback.next_steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
