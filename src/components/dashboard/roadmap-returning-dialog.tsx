'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { History, RefreshCcw, ArrowRight, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { getLearnMetricStatus, type LearnMetricStatus } from '@/lib/roadmap-api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user decides to continue from old metrics */
  onContinue: () => void;
  /** Called when user decides to retake placement test */
  onRetake: () => void;
}

export function RoadmapReturningDialog({ open, onOpenChange, onContinue, onRetake }: Props) {
  const [metricStatus, setMetricStatus] = useState<LearnMetricStatus | null>(null);

  useEffect(() => {
    if (open) {
      getLearnMetricStatus().then(setMetricStatus).catch(() => {});
    }
  }, [open]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600" />
            Chào mừng trở lại!
          </DialogTitle>
          <DialogDescription>
            Moni đã tìm thấy thông tin trình độ trước đây của bạn. Bạn muốn tiếp tục từ đó hay làm lại bài đánh giá?
          </DialogDescription>
        </DialogHeader>

        {metricStatus && (
          <div className="bg-indigo-50 rounded-xl p-4 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-600">Số chủ đề đã đánh giá:</span>
              <span className="font-semibold">{metricStatus.metricCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cập nhật lần cuối:</span>
              <span className="font-semibold">{formatDate(metricStatus.lastMetricDate)}</span>
            </div>
            {metricStatus.lastWeekNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Đã học đến tuần:</span>
                <span className="font-semibold">Tuần {metricStatus.lastWeekNumber}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            onClick={onContinue}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl justify-start px-4"
          >
            <History className="h-5 w-5 mr-3 shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Tiếp tục từ trình độ cũ</div>
              <div className="text-xs text-indigo-200">Lên lộ trình dựa trên kết quả đã có</div>
            </div>
          </Button>

          <Button
            onClick={onRetake}
            variant="outline"
            className="w-full h-12 rounded-xl justify-start px-4 border-gray-200 hover:bg-gray-50"
          >
            <RefreshCcw className="h-5 w-5 mr-3 shrink-0 text-gray-500" />
            <div className="text-left">
              <div className="font-semibold text-gray-700">Làm lại bài đánh giá</div>
              <div className="text-xs text-gray-400">Đánh giá lại trình độ trước khi lên lộ trình</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
