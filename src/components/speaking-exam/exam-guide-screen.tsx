'use client';

import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type RecordingMode = 'auto' | 'manual';

interface Props {
  onNext: () => void;
  showQuestion: boolean;
  onToggleShowQuestion: (val: boolean) => void;
  recordingMode: RecordingMode;
  onChangeRecordingMode: (mode: RecordingMode) => void;
}

export function ExamGuideScreen({ onNext, showQuestion, onToggleShowQuestion, recordingMode, onChangeRecordingMode }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-8 text-center text-xl font-semibold text-[#2d3748]">
        Hướng dẫn chung
      </h2>

      {/* Options */}
      <div className="mb-8 space-y-3">
        {/* Show question checkbox */}
        <div className="rounded-lg border border-gray-300 bg-white px-5 py-4">
          <label 
            className="flex cursor-pointer items-start gap-3"
            onClick={() => onToggleShowQuestion(!showQuestion)}
          >
            <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-400">
              {showQuestion && (
                <div className="h-2.5 w-2.5 rounded-full bg-[#f97316]" />
              )}
            </div>
            <div>
              <p className="font-semibold text-[#2d3748]">
                Luôn hiển thị sẵn câu hỏi trên màn hình
              </p>
              <p className="text-sm text-gray-500">
                Nếu tick vào lựa chọn này, câu hỏi sẽ được hiển thị song song với Audio được phát
              </p>
            </div>
          </label>
        </div>

        {/* Recording mode selection */}
        <div className="rounded-lg border border-gray-300 bg-white px-5 py-4">
          <p className="mb-3 font-semibold text-[#2d3748]">Chế độ ghi âm</p>
          <div className="flex gap-4">
            <label
              className="flex flex-1 cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 transition-colors"
              style={{
                borderColor: recordingMode === 'auto' ? '#f97316' : '#e5e7eb',
                backgroundColor: recordingMode === 'auto' ? '#fff7ed' : '#fff',
              }}
              onClick={() => onChangeRecordingMode('auto')}
            >
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-400 shrink-0">
                {recordingMode === 'auto' && (
                  <div className="h-2.5 w-2.5 rounded-full bg-[#f97316]" />
                )}
              </div>
              <div>
                <p className="font-medium text-[#2d3748]">Tự động</p>
                <p className="text-xs text-gray-500">
                  Mic tự bật sau khi AI đọc xong, tự chuyển câu khi bạn dừng nói
                </p>
              </div>
            </label>
            <label
              className="flex flex-1 cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 transition-colors"
              style={{
                borderColor: recordingMode === 'manual' ? '#f97316' : '#e5e7eb',
                backgroundColor: recordingMode === 'manual' ? '#fff7ed' : '#fff',
              }}
              onClick={() => onChangeRecordingMode('manual')}
            >
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-400 shrink-0">
                {recordingMode === 'manual' && (
                  <div className="h-2.5 w-2.5 rounded-full bg-[#f97316]" />
                )}
              </div>
              <div>
                <p className="font-medium text-[#2d3748]">Chủ động</p>
                <p className="text-xs text-gray-500">
                  Bạn tự bấm mic để bắt đầu nói, bấm dừng khi trả lời xong
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <p className="mb-6 text-[#2d3748]">
        Để việc làm bài diễn ra thật thuận lợi, bạn hãy chú ý những điểm quan trọng sau:
      </p>

      <div className="mb-8 space-y-4 text-[#2d3748]">
        <p className="leading-relaxed">
          <span className="font-bold text-[#c24b3a]">
            Kiểm tra và đảm bảo Loa/Tai nghe và Microphone đã kết nối.
          </span>{' '}
          Bạn hãy Test microphone trước khi làm bài để đảm bảo bài làm của bạn được ghi nhận đầy đủ nhé!
        </p>
        <p className="leading-relaxed">
          <span className="font-bold text-[#c24b3a]">
            Làm bài ở nơi yên tĩnh, ít tiếng ồn và âm thanh nhiễu.
          </span>{' '}
          Nói gần microphone để YouPass ghi âm được chất lượng tốt nhất. Chất lượng file ghi âm quá thấp,
          nhiều tạp âm sẽ ảnh hưởng rất nhiều đến việc chấm điểm bạn nha.
        </p>
        <p className="leading-relaxed">
          <span className="font-bold text-[#c24b3a]">
            Lưu ý giới hạn thời gian trả lời!!
          </span>{' '}
          Với kinh nghiệm đi thi rất nhiều lần của đội ngũ Học thuật tại YouPass, khi đi thi thật, Giám khảo sẽ
          ngắt phần trả lời và chuyển sang câu khác nếu bạn nói quá dài chứ không đợi bạn nói hết ý. Vì vậy bạn hãy tập làm quen với việc trả lời trong một khoảng thời gian cố định bạn nhé!
        </p>
      </div>

      <p className="mb-8 text-base italic text-[#2d3748]">
        (*): Từ sau màn này thì{' '}
        <span className="font-bold">
          toàn bộ nội dung hướng dẫn làm bài đều sẽ là Tiếng Anh
        </span>{' '}
        bạn nhé!
      </p>

      {/* Next button */}
      <div className="flex justify-center border-t border-gray-200 pt-6">
        <Button
          onClick={onNext}
          className="gap-2 rounded-full bg-[#f97316] px-8 py-3 text-white hover:bg-[#ea580c]"
        >
          <Play className="h-4 w-4" />
          Next step
        </Button>
      </div>
    </div>
  );
}
