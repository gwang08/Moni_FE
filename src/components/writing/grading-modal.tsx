'use client';

import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { GradingResult } from '@/types/writing.types';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GradingResult | null;
  isLoading?: boolean;
}

const CRITERIA_LABELS = [
  { key: 'taskAchievement', label: 'Task Achievement' },
  { key: 'coherenceCohesion', label: 'Coherence & Cohesion' },
  { key: 'lexicalResource', label: 'Lexical Resource' },
  { key: 'grammaticalRange', label: 'Grammatical Range' },
] as const;

export function GradingModal({ isOpen, onClose, result, isLoading }: GradingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kết quả chấm bài</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-sm text-muted-foreground">Đang chấm bài, vui lòng chờ...</p>
          </div>
        )}

        {!isLoading && result && (
          <div className="space-y-6">
            {/* Overall band score */}
            <div className="text-center p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
              <p className="text-sm uppercase tracking-widest mb-2 opacity-90">Overall Band Score</p>
              <p className="text-6xl font-bold">{result.overallBand.toFixed(1)}</p>
            </div>

            {/* Criteria scores grid */}
            <div className="grid grid-cols-2 gap-3">
              {CRITERIA_LABELS.map(({ key, label }) => (
                <div key={key} className="border border-emerald-100 rounded-lg p-4 bg-emerald-50/50">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {result[key].toFixed(1)}
                  </p>
                </div>
              ))}
            </div>

            {/* Feedback */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 text-gray-800">Nhận xét</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {result.feedback}
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Đóng
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
