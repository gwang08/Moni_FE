'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface QuizSetupProps {
  onStart: (params: { source: string; count: number; band?: string; topic?: string }) => void;
  loading: boolean;
}

const COUNT_OPTIONS = [10, 15, 20];

export function QuizSetup({ onStart, loading }: QuizSetupProps) {
  const [source, setSource] = useState<'saved' | 'curated'>('saved');
  const [count, setCount] = useState(10);
  const [band, setBand] = useState('');
  const [topic, setTopic] = useState('');

  const handleStart = () => {
    onStart({
      source,
      count,
      band: source === 'curated' ? band || undefined : undefined,
      topic: source === 'curated' ? topic || undefined : undefined,
    });
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Trắc nghiệm từ vựng</h2>
        <p className="text-sm text-gray-500">Kiểm tra kiến thức từ vựng của bạn</p>
      </div>

      {/* Source */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Nguồn từ vựng</Label>
        <div className="flex gap-3">
          {(['saved', 'curated'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-colors ${
                source === s
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {s === 'saved' ? 'Từ đã lưu' : 'Từ tổng hợp'}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Số câu hỏi</Label>
        <div className="flex gap-3">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-colors ${
                count === n
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Curated filters */}
      {source === 'curated' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Band (tuỳ chọn)</Label>
            <input
              value={band}
              onChange={(e) => setBand(e.target.value)}
              placeholder="vd: 6.0, 7.0..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Chủ đề (tuỳ chọn)</Label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="vd: Technology, Environment..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <Button
        className="w-full"
        onClick={handleStart}
        disabled={loading}
        size="lg"
      >
        {loading ? 'Đang tạo câu hỏi...' : 'Bắt đầu'}
      </Button>
    </div>
  );
}
