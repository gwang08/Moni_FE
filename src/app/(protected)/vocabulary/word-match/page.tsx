'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WordMatchSetup } from '@/components/vocabulary/word-match-setup';
import { WordMatchBoard } from '@/components/vocabulary/word-match-board';
import { WordMatchResult } from '@/components/vocabulary/word-match-result';
import { getWordMatch } from '@/lib/vocab-api';
import { WordMatchPair } from '@/types/vocab.types';
import { toast } from 'sonner';

type Screen = 'setup' | 'game' | 'result';

export default function WordMatchPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('setup');
  const [loading, setLoading] = useState(false);
  const [pairs, setPairs] = useState<WordMatchPair[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [moves, setMoves] = useState(0);

  const handleStart = async (params: {
    source: string;
    count: number;
    band?: string;
    topic?: string;
  }) => {
    setLoading(true);
    try {
      const res = await getWordMatch(params.count, params.source, params.band, params.topic);
      if (!res.pairs.length) {
        toast.error('Không đủ từ vựng. Hãy thêm từ hoặc đổi nguồn.');
        return;
      }
      setPairs(res.pairs);
      setScreen('game');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = useCallback((seconds: number, moveCount: number) => {
    setElapsedSeconds(seconds);
    setMoves(moveCount);
    setScreen('result');
  }, []);

  const handleRetry = () => {
    setPairs([]);
    setElapsedSeconds(0);
    setMoves(0);
    setScreen('setup');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold text-gray-900">Nối từ</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      )}

      {!loading && screen === 'setup' && (
        <WordMatchSetup onStart={handleStart} loading={loading} />
      )}

      {!loading && screen === 'game' && pairs.length > 0 && (
        <WordMatchBoard pairs={pairs} onComplete={handleComplete} />
      )}

      {!loading && screen === 'result' && (
        <WordMatchResult
          elapsedSeconds={elapsedSeconds}
          moves={moves}
          totalPairs={pairs.length}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
