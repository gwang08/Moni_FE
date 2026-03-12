'use client';

import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  title: string;
  questionCount: number;
  elapsedTime: string;
  submitted: boolean;
  answeredCount: number;
  totalQuestions: number;
  onSubmit: () => void;
  onExit: () => void;
}

export function ListeningPracticeHeader({
  title,
  questionCount,
  elapsedTime,
  submitted,
  answeredCount,
  totalQuestions,
  onSubmit,
  onExit,
}: Props) {
  return (
    <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {submitted ? (
          <Link href="/practice">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
            {submitted && (
              <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
                Đã hoàn thành
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {questionCount > 0 && <span>{questionCount} câu hỏi</span>}
            {!submitted && (
              <span className="text-gray-400">
                Đã trả lời: {answeredCount}/{totalQuestions}
              </span>
            )}
            <span className={`flex items-center gap-1 font-mono tabular-nums ${submitted ? 'text-violet-600' : ''}`}>
              <Clock className="h-3 w-3" />
              {elapsedTime}
            </span>
          </div>
        </div>
      </div>

      {!submitted ? (
        <Button
          onClick={onSubmit}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          Hoàn thành
        </Button>
      ) : (
        <Link href="/practice">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      )}
    </div>
  );
}
