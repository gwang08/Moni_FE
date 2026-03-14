'use client';

import { BookOpen, ClipboardList } from 'lucide-react';

interface Props {
  onSelectTest: () => void;
  onSelectSelfAssess: () => void;
  loading: boolean;
}

export function ModeSelectionStep({ onSelectTest, onSelectSelfAssess, loading }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Chọn phương thức đánh giá</h2>
          <p className="text-sm text-gray-500">
            Làm bài test để đánh giá chính xác hoặc tự đánh giá nhanh
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Test mode card */}
          <button
            onClick={onSelectTest}
            disabled={loading}
            className="flex flex-col items-center gap-4 p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-orange-400 hover:shadow-md transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              {loading ? (
                <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <BookOpen className="h-7 w-7 text-blue-600" />
              )}
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-800 mb-1">Làm bài test Reading + Listening</h3>
              <p className="text-sm text-gray-500">
                Hệ thống sẽ chọn bài ngắn để đánh giá trình độ thực tế của bạn
              </p>
            </div>
          </button>

          {/* Self-assess card */}
          <button
            onClick={onSelectSelfAssess}
            disabled={loading}
            className="flex flex-col items-center gap-4 p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-orange-400 hover:shadow-md transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <ClipboardList className="h-7 w-7 text-purple-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-800 mb-1">Tự đánh giá tất cả</h3>
              <p className="text-sm text-gray-500">
                Nhập band điểm bạn tự đánh giá cho cả 4 kỹ năng
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
