'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PenLine, Clock } from 'lucide-react';
import type { TestDetailResponse } from '@/types/test.types';

interface Props {
  testDetail: TestDetailResponse;
  essay: string;
  onEssayChange: (essay: string) => void;
  onComplete: () => void;
  elapsedTime: string;
}

export function WritingTestStep({ testDetail, essay, onEssayChange, onComplete, elapsedTime }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);

  // Extract writing prompt from first stimulus
  const prompt = testDetail.stimuli?.[0]?.content || testDetail.description || 'Write an essay on the given topic.';
  const taskType = testDetail.section === 1 ? 'Task 1' : 'Task 2';

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const minWords = testDetail.section === 1 ? 150 : 250;

  const handleSubmit = () => {
    if (wordCount === 0) {
      setShowConfirm(true);
      return;
    }
    if (wordCount < 50) {
      setShowConfirm(true);
      return;
    }
    onComplete();
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-teal-50/40 via-white to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-200">
              <PenLine className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Writing - {taskType}</h2>
              <p className="text-sm text-gray-500">Viết bài theo đề bài bên dưới</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            {elapsedTime}
          </div>
        </div>

        {/* Prompt Card */}
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 p-6 mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-500" />
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Đề bài</span>
          <div
            className="mt-3 prose prose-sm max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: prompt }}
          />
          {testDetail.stimuli?.[0]?.mediaUrl && (
            <img
              src={testDetail.stimuli[0].mediaUrl}
              alt="Task illustration"
              className="mt-4 max-w-full rounded-lg border"
            />
          )}
        </div>

        {/* Essay Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
          {/* Status bar */}
          <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Bài viết của bạn
              </span>
              <div className="text-xs text-gray-500">
                Số từ:{' '}
                <span className={wordCount < minWords ? 'text-orange-600 font-bold' : 'text-teal-600 font-bold'}>
                  {wordCount}
                </span>
                <span className="text-gray-400"> / tối thiểu {minWords}</span>
              </div>
            </div>
          </div>
          <textarea
            value={essay}
            onChange={(e) => onEssayChange(e.target.value)}
            placeholder="Viết bài của bạn tại đây..."
            className="w-full min-h-[350px] p-6 text-sm text-gray-800 leading-relaxed resize-y focus:outline-none placeholder:text-gray-300"
          />
          {/* Word count progress */}
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  wordCount >= minWords ? 'bg-teal-500' : 'bg-orange-400'
                }`}
                style={{ width: `${Math.min((wordCount / minWords) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSubmit}
            className="h-12 px-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-lg shadow-teal-200/50 transition-all"
          >
            Tiếp tục Speaking
          </Button>
        </div>

        {/* Low word count warning */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">
                {wordCount === 0 ? 'Bạn chưa viết gì' : 'Bài viết quá ngắn'}
              </h3>
              <p className="text-sm text-gray-600">
                {wordCount === 0 ? (
                  <>
                    Bạn chưa viết bài. Nếu bỏ qua, điểm Writing sẽ là <span className="font-bold text-red-600">0.0</span>.
                    Bạn nên viết ít nhất <span className="font-bold">{minWords}</span> từ để có kết quả chính xác.
                  </>
                ) : (
                  <>
                    Bài viết của bạn chỉ có <span className="font-bold text-orange-600">{wordCount}</span> từ.
                    Bạn nên viết ít nhất <span className="font-bold">{minWords}</span> từ để có kết quả chính xác hơn.
                  </>
                )}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowConfirm(false)} className="rounded-xl">
                  {wordCount === 0 ? 'Quay lại viết' : 'Viết thêm'}
                </Button>
                <Button onClick={onComplete} className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white">
                  {wordCount === 0 ? 'Bỏ qua' : 'Nộp bài'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
