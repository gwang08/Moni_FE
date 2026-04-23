'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScoringMethodSelector } from './scoring-method-selector';
import { CreditConfirmDialog } from './credit-confirm-dialog';
import { useAuthStore } from '@/store/auth-store';

interface ScoringDialogProps {
  open: boolean;
  onClose: () => void;
  onAIScore: () => void;
  skill: 'writing' | 'speaking';
  aiCreditCost?: number;
  expertCreditCost?: number;
}

const DEFAULT_AI_COST = { writing: 30, speaking: 30 };
const DEFAULT_EXPERT_COST = { writing: 100, speaking: 120 };

export function ScoringDialog({
  open,
  onClose,
  onAIScore,
  skill,
  aiCreditCost,
  expertCreditCost,
}: ScoringDialogProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const balance = 0; // Credit system removed

  const aiCost = aiCreditCost ?? DEFAULT_AI_COST[skill];
  const expertCost = expertCreditCost ?? DEFAULT_EXPERT_COST[skill];

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSelectAI = () => {
    if (balance < aiCost) {
      setConfirmOpen(true); // show insufficient dialog
      return;
    }
    setConfirmOpen(true);
  };

  const handleSelectExpert = () => {
    if (balance < expertCost) {
      setConfirmOpen(true);
      return;
    }
    onClose();
    router.push(`/expert-scoring?skill=${skill}`);
  };

  const handleConfirmAI = () => {
    setConfirmOpen(false);
    onClose();
    onAIScore();
  };

  return (
    <>
      <Dialog open={open && !confirmOpen} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chấm điểm bài {skill === 'writing' ? 'Writing' : 'Speaking'}</DialogTitle>
          </DialogHeader>
          <ScoringMethodSelector
            onSelectAI={handleSelectAI}
            onSelectExpert={handleSelectExpert}
            aiCreditCost={aiCost}
            expertCreditCost={expertCost}
            currentBalance={balance}
            skill={skill}
          />
        </DialogContent>
      </Dialog>

      <CreditConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmAI}
        serviceName={`Chấm ${skill === 'writing' ? 'Writing' : 'Speaking'} bằng AI`}
        creditCost={aiCost}
        currentBalance={balance}
      />
    </>
  );
}
