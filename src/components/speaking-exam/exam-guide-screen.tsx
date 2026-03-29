'use client';

import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onNext: () => void;
  showQuestion: boolean;
  onToggleShowQuestion: (val: boolean) => void;
}

export function ExamGuideScreen({ onNext, showQuestion, onToggleShowQuestion }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-8 text-center text-xl font-semibold text-[#2d3748]">
        Hướng dẫn chung
      </h2>

      {/* Checkbox */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white px-5 py-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={showQuestion}
            onChange={(e) => onToggleShowQuestion(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 accent-blue-600"
          />
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

      {/* Instructions */}
      <p className="mb-4 text-[#2d3748]">
        Để việc làm bài diễn ra thật thuận lợi, bạn hãy chú ý những điểm quan trọng sau:
      </p>

      <ul className="mb-6 space-y-4 text-[#2d3748]">
        <li className="leading-relaxed">
          <span className="font-bold text-[#2d3748]">
            • Kiểm tra và đảm bảo Loa/Tai nghe và Microphone đã kết nối.
          </span>{' '}
          Bạn hãy Test microphone trước khi làm bài để đảm bảo bài làm của bạn được ghi nhận đầy đủ nhé!
        </li>
        <li className="leading-relaxed">
          <span className="font-bold text-[#2d3748]">
            • Làm bài ở nơi yên tĩnh, ít tiếng ồn và âm thanh nhiều.
          </span>{' '}
          Nói gần microphone để ghi âm được chất lượng tốt nhất. Chất lượng file ghi âm quá thấp, 
          nhiều tạp âm sẽ ảnh hưởng rất nhiều đến việc chấm điểm bạn nha.
        </li>
        <li className="leading-relaxed">
          <span className="font-bold text-[#2d3748]">
            • Lưu ý giới hạn thời gian trả lời!!
          </span>{' '}
          Với kinh nghiệm đi thi rất nhiều lần của đội ngũ Học thuật, khi đi thi thật, Giám khảo sẽ 
          ngắt phần trả lời và chuyển sang câu khác nếu bạn nói quá dài chủ không đợi bạn nói hết ý. 
          Vì vậy bạn hãy tập làm quen với việc trả lời trong một khoảng thời gian cố định bạn nhé!
        </li>
      </ul>

      <p className="mb-8 text-sm italic text-gray-500">
        (*): Từ sau màn này thì{' '}
        <span className="font-bold text-[#2d3748]">
          toàn bộ nội dung hướng dẫn làm bài đều sẽ là Tiếng Anh
        </span>{' '}
        bạn nhé!
      </p>

      {/* Next button */}
      <div className="flex justify-center">
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
