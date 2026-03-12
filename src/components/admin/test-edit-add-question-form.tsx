'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X } from 'lucide-react';
import { McqOptions } from '@/components/admin/test-import-question-options-mcq';
import { TfngOptions } from '@/components/admin/test-import-question-options-tfng';
import { FillOptions } from '@/components/admin/test-import-question-options-fill';
import { createQuestion } from '@/lib/admin-api';
import { defaultOptions } from '@/lib/question-defaults';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { QuestionTypeCode, OptionRequest } from '@/types/admin.types';

interface Props {
  groupId: number;
  questionTypeCode: QuestionTypeCode;
  testId: string;
  nextPosition: number;
  onClose: () => void;
}

export function TestEditAddQuestionForm({ groupId, questionTypeCode, testId, nextPosition, onClose }: Props) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState('');
  const [options, setOptions] = useState<OptionRequest[]>(defaultOptions(questionTypeCode));

  const handleSubmit = async () => {
    if (!content.trim()) { toast.error('Vui lòng nhập nội dung câu hỏi'); return; }
    setSaving(true);
    try {
      await createQuestion(groupId, { content, position: nextPosition, options });
      toast.success(`Đã thêm câu ${nextPosition}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
      onClose();
    } catch {
      toast.error('Thêm câu hỏi thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-green-300 rounded-lg p-3 bg-green-50/30 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold text-green-700">Thêm câu {nextPosition}</h5>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div>
        <Label className="mb-1 block text-xs text-gray-600">Nội dung câu hỏi *</Label>
        <Input value={content} onChange={e => setContent(e.target.value)}
          placeholder="Nhập nội dung câu hỏi..." className="text-xs h-7" />
      </div>

      {(questionTypeCode === 'MCQ' || questionTypeCode === 'MCQ_MULTIPLE') && (
        <McqOptions options={options} onChange={setOptions} multiple={questionTypeCode === 'MCQ_MULTIPLE'} />
      )}
      {(questionTypeCode === 'TFNG' || questionTypeCode === 'YNNG') && (
        <TfngOptions options={options} onChange={setOptions} variant={questionTypeCode} />
      )}
      {(questionTypeCode === 'GAP_FILLING' || questionTypeCode === 'DIAGRAM_LABEL') && (
        <FillOptions options={options} onChange={setOptions} variant={questionTypeCode} />
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onClose}>Hủy</Button>
        <Button type="button" size="sm" className="h-7 text-xs" onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          Tạo câu hỏi
        </Button>
      </div>
    </div>
  );
}
