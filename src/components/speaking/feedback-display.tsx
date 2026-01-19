'use client';

import type { SpeakingFeedback } from '@/types/speaking.types';

interface FeedbackDisplayProps {
  feedback: SpeakingFeedback;
}

export function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
  const criteria = [
    { label: 'Fluency & Coherence', value: feedback.fluency },
    { label: 'Pronunciation', value: feedback.pronunciation },
    { label: 'Lexical Resource', value: feedback.vocabulary },
    { label: 'Grammatical Range', value: feedback.grammar },
  ];

  return (
    <div className="bg-white border rounded-lg p-6 space-y-6">
      <div className="text-center p-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg text-white">
        <p className="text-sm uppercase tracking-wide mb-2">Overall Band Score</p>
        <p className="text-5xl font-bold">{feedback.overallScore.toFixed(1)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {criteria.map((criterion) => (
          <div key={criterion.label} className="border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">{criterion.label}</p>
            <p className="text-2xl font-bold text-blue-600">{criterion.value.toFixed(1)}</p>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <h4 className="font-bold mb-2">Nhận xét</h4>
        <p className="text-gray-700">{feedback.comments}</p>
      </div>
    </div>
  );
}
