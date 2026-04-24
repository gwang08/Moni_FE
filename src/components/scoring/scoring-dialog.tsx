'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScoringMethodSelector } from './scoring-method-selector';

interface ScoringDialogProps {
  open: boolean;
  onClose: () => void;
  onAIScore: () => void;
  skill: 'writing' | 'speaking';
  /** Legacy props, giữ cho backward compat nhưng không dùng. */
  aiCreditCost?: number;
  expertCreditCost?: number;
}

export function ScoringDialog({ open, onClose, onAIScore, skill }: ScoringDialogProps) {
  const router = useRouter();

  const handleSelectAI = () => {
    onClose();
    onAIScore();
  };

  const handleSelectExpert = () => {
    onClose();
    router.push(`/expert-scoring?skill=${skill}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chấm điểm bài {skill === 'writing' ? 'Writing' : 'Speaking'}</DialogTitle>
        </DialogHeader>
        <ScoringMethodSelector
          onSelectAI={handleSelectAI}
          onSelectExpert={handleSelectExpert}
          skill={skill}
        />
      </DialogContent>
    </Dialog>
  );
}
