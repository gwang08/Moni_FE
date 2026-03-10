'use client';

import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, FileText, MessageSquare } from 'lucide-react';
import type { StimulusRequest } from '@/types/admin.types';
import type { BasicInfo } from '@/components/admin/test-import-step1-basic-info';

const TYPE_LABELS: Record<string, string> = {
  MCQ: 'Trắc nghiệm (MCQ)',
  TFNG: 'True / False / Not Given',
  YNNG: 'Yes / No / Not Given',
  MATCHING: 'Nối đáp án',
  FILL_IN_THE_BLANK: 'Điền từ vào chỗ trống',
  SHORT_ANSWER: 'Trả lời ngắn',
};

interface Props {
  basicInfo: BasicInfo;
  stimuli: StimulusRequest[];
  submitting: boolean;
  error: string;
  onSubmit: () => void;
  onBack: () => void;
}

export function TestImportStep4({ basicInfo, stimuli, submitting, error, onSubmit, onBack }: Props) {
  const totalQuestions = stimuli.reduce(
    (sum, s) => sum + s.questionGroups.reduce((gs, g) => gs + g.questions.length, 0), 0
  );
  const totalGroups = stimuli.reduce((sum, s) => sum + s.questionGroups.length, 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Tóm tắt bài thi</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <p><span className="text-gray-500">Tiêu đề:</span> <span className="font-medium">{basicInfo.title}</span></p>
          <p><span className="text-gray-500">Kỹ năng:</span> <span className="font-medium">{basicInfo.skill}</span></p>
          {basicInfo.thumbnailUrl && (
            <p><span className="text-gray-500">Ảnh bìa:</span> <span className="font-medium">Đã tải lên</span></p>
          )}
          {basicInfo.description && (
            <p className="col-span-2"><span className="text-gray-500">Mô tả:</span> {basicInfo.description}</p>
          )}
          <p><span className="text-gray-500">Số passage:</span> {stimuli.length}</p>
          <p><span className="text-gray-500">Tổng nhóm:</span> {totalGroups}</p>
          <p><span className="text-gray-500">Tổng câu hỏi:</span> <span className="font-semibold text-blue-700">{totalQuestions}</span></p>
        </div>
      </div>

      {/* Per stimulus detail */}
      {stimuli.map((s, si) => (
        <div key={si} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Passage {si + 1}</span>
            <span className="text-xs text-gray-400 ml-auto">
              {s.questionGroups.length} nhóm · {s.questionGroups.reduce((sum, g) => sum + g.questions.length, 0)} câu
            </span>
          </div>

          <div className="p-4 space-y-4">
            {s.questionGroups.map((g, gi) => {
              const positionOffset = s.questionGroups.slice(0, gi).reduce((sum, prev) => sum + prev.questions.length, 0);
              return (
                <div key={gi} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Nhóm {gi + 1}: {TYPE_LABELS[g.questionTypeCode] ?? g.questionTypeCode}
                    </span>
                    <span className="text-xs text-gray-400">{g.questions.length} câu</span>
                  </div>
                  {g.instruction && (
                    <p className="text-xs text-gray-500 italic ml-2">{g.instruction}</p>
                  )}

                  {g.questions.map((q, qi) => {
                    const correct = q.options.filter(o => o.isCorrect);
                    return (
                      <div key={qi} className="ml-2 border-l-2 border-gray-200 pl-3 py-1.5 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Câu {positionOffset + qi + 1}.</span>{' '}
                          {q.content || <span className="text-red-400 italic">Chưa nhập nội dung</span>}
                        </p>

                        {/* Options */}
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                          {q.options.map((o, oi) => (
                            <span key={oi} className={`text-xs ${o.isCorrect ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                              {o.isCorrect && <CheckCircle2 className="h-3 w-3 inline mr-0.5 -mt-0.5" />}
                              {o.label ? `${o.label}. ` : ''}{o.content}
                            </span>
                          ))}
                        </div>

                        {/* Explanation & evidence */}
                        {(q.explanation?.text || q.explanation?.evidence) && (
                          <div className="flex gap-3 mt-1">
                            {q.explanation.text && (
                              <p className="text-xs text-gray-500">
                                <MessageSquare className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                                {q.explanation.text}
                              </p>
                            )}
                            {q.explanation.evidence && (
                              <p className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded max-w-sm truncate">
                                &ldquo;{q.explanation.evidence.replace(/\n---\n/g, ' | ')}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Đang tạo...</> : 'Tạo bài thi'}
        </Button>
      </div>
    </div>
  );
}
