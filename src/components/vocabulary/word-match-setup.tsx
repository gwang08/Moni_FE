'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface WordMatchSetupProps {
  onStart: (params: { source: string; count: number; band?: string; topic?: string }) => void;
  loading: boolean;
}

const COUNT_OPTIONS = [6, 8, 10];

export function WordMatchSetup({ onStart, loading }: WordMatchSetupProps) {
  const [source, setSource] = useState<'saved' | 'curated'>('saved');
  const [count, setCount] = useState(6);
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
        <h2 className="text-xl font-bold text-gray-900 mb-1">Nối từ</h2>
        <p className="text-sm text-gray-500">Ghép từ với nghĩa đúng để ghi điểm</p>
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
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
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
        <Label className="text-sm font-medium text-gray-700">Số cặp từ</Label>
        <div className="flex gap-3">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-colors ${
                count === n
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Chủ đề (tuỳ chọn)</Label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="vd: Technology, Environment..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      <Button
        className="w-full bg-purple-600 hover:bg-purple-700"
        onClick={handleStart}
        disabled={loading}
        size="lg"
      >
        {loading ? 'Đang tải...' : 'Bắt đầu chơi'}
      </Button>
    </div>
  );
}
