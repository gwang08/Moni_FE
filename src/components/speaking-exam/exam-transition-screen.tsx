'use client';

import { Loader2 } from 'lucide-react';

interface Props {
  message?: string;
}

export function ExamTransitionScreen({ message = 'Đang chuyển part...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      <p className="text-lg font-medium text-gray-600">{message}</p>
    </div>
  );
}
