'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ExpertEvaluation } from '@/types/expert.types';

const SCORE_LABELS: Record<string, string> = {
  fluency: 'Fluency',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  pronunciation: 'Pronunciation',
  taskResponse: 'Task Response',
  coherence: 'Coherence',
  lexicalResource: 'Lexical Resource',
  grammaticalRange: 'Grammatical Range',
};

export function EvaluationDialog({
  open, onClose, evaluation,
}: {
  open: boolean;
  onClose: () => void;
  evaluation: ExpertEvaluation | null;
}) {
  if (!evaluation) return null;

  const scoreKeys = Object.keys(SCORE_LABELS) as (keyof ExpertEvaluation)[];
  const bandScores = scoreKeys.filter(k => evaluation[k] !== undefined && evaluation[k] !== null);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kết quả đánh giá</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {evaluation.expertName && <span>Giảng viên: <strong className="text-foreground">{evaluation.expertName}</strong></span>}
            <span>{new Date(evaluation.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl bg-primary/5 border py-5">
            <span className="text-4xl font-bold text-primary">{evaluation.overallScore}</span>
            <span className="text-sm text-muted-foreground mt-1">Band Score tổng thể</span>
          </div>

          {bandScores.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Chi tiết điểm</p>
              <div className="grid grid-cols-2 gap-2">
                {bandScores.map((k) => (
                  <div key={k} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{SCORE_LABELS[k as string]}</span>
                    <span className="font-semibold">{evaluation[k] as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {evaluation.feedback && (
            <div>
              <p className="text-sm font-medium mb-1">Nhận xét</p>
              <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">{evaluation.feedback}</p>
            </div>
          )}

          {evaluation.strengths && (
            <div>
              <p className="text-sm font-medium mb-1 text-green-700">Điểm mạnh</p>
              <p className="text-sm text-muted-foreground bg-green-50 rounded-lg px-3 py-2">{evaluation.strengths}</p>
            </div>
          )}

          {evaluation.areasForImprovement && (
            <div>
              <p className="text-sm font-medium mb-1 text-amber-700">Cần cải thiện</p>
              <p className="text-sm text-muted-foreground bg-amber-50 rounded-lg px-3 py-2">{evaluation.areasForImprovement}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
