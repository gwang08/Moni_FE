'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  error: string;
  onRetry?: () => void;
}

export function ExamErrorDisplay({ error, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h2 className="text-xl font-bold text-gray-900">Đã xảy ra lỗi</h2>
      <p className="max-w-md text-center text-gray-600">{error}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Kết nối lại
        </Button>
      )}
    </div>
  );
}
