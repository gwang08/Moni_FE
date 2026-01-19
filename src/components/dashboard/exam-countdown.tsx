'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/store/user-store';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeRemaining(examDate: string | null): TimeRemaining | null {
  if (!examDate) return null;

  const now = new Date();
  const target = new Date(examDate);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ExamCountdown() {
  const examDate = useUserStore((state) => state.examDate);
  const setExamDate = useUserStore((state) => state.setExamDate);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    if (!examDate) {
      setTimeRemaining(null);
      return;
    }

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining(examDate));

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(examDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [examDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Countdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="exam-date" className="text-sm font-medium block mb-2">
            Exam Date
          </label>
          <input
            id="exam-date"
            type="date"
            value={examDate || ''}
            onChange={(e) => setExamDate(e.target.value || null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {examDate && (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{formatDate(examDate)}</p>
            {timeRemaining && (
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold">{timeRemaining.days}</span>
                  <span className="text-xs text-muted-foreground">ngày</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold">{timeRemaining.hours}</span>
                  <span className="text-xs text-muted-foreground">giờ</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold">{timeRemaining.minutes}</span>
                  <span className="text-xs text-muted-foreground">phút</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
