'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GradingResult } from '@/types/writing.types';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GradingResult;
}

export function GradingModal({ isOpen, onClose, result }: GradingModalProps) {
  const criteria = [
    { label: 'Task Achievement', value: result.taskAchievement },
    { label: 'Coherence & Cohesion', value: result.coherenceCohesion },
    { label: 'Lexical Resource', value: result.lexicalResource },
    { label: 'Grammatical Range', value: result.grammaticalRange },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kết quả chấm bài</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Band Score */}
          <div className="text-center p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
            <p className="text-sm uppercase tracking-wide mb-2">Overall Band Score</p>
            <p className="text-5xl font-bold">{result.overallBand.toFixed(1)}</p>
          </div>

          {/* Criteria Scores */}
          <div className="grid grid-cols-2 gap-4">
            {criteria.map((criterion) => (
              <div key={criterion.label} className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">{criterion.label}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {criterion.value.toFixed(1)}
                </p>
              </div>
            ))}
          </div>

          {/* Feedback */}
          <div className="border-t pt-4">
            <h4 className="font-bold mb-2">Nhận xét</h4>
            <p className="text-gray-700">{result.feedback}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
