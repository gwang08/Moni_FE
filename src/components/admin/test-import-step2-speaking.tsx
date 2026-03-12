'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import type { StimulusRequest, QuestionRequest } from '@/types/admin.types';

interface Props {
  stimuli: StimulusRequest[];
  onChange: (stimuli: StimulusRequest[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const emptyStimulus = (): StimulusRequest => ({
  title: '',
  content: '',
  mediaUrl: undefined,
  section: 1,
  questionGroups: [{
    questionTypeCode: 'SHORT_ANSWER',
    instruction: '',
    questions: [],
  }],
});

const emptyQuestion = (): QuestionRequest => ({
  content: '',
  options: [{ label: 'A', content: 'SPEAKING_ANSWER', isCorrect: true }],
  explanation: { text: '' },
});

export function TestImportStep2Speaking({ stimuli, onChange, onNext, onBack }: Props) {
  useEffect(() => {
    if (stimuli.length === 0) onChange([emptyStimulus()]);
  }, [stimuli.length, onChange]);

  if (stimuli.length === 0) return null;

  const stimulus = stimuli[0];
  const group = stimulus.questionGroups[0] || { questionTypeCode: 'SHORT_ANSWER' as const, instruction: '', questions: [] };
  const questions = group.questions;

  const updateStimulus = (patch: Partial<StimulusRequest>) => onChange([{ ...stimulus, ...patch }]);

  const updateQuestion = (index: number, patch: Partial<QuestionRequest>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...patch };
    updateStimulus({ questionGroups: [{ ...group, questions: updated }] });
  };

  const addQuestion = () => {
    updateStimulus({ questionGroups: [{ ...group, questions: [...questions, emptyQuestion()] }] });
  };

  const removeQuestion = (index: number) => {
    updateStimulus({ questionGroups: [{ ...group, questions: questions.filter((_, i) => i !== index) }] });
  };

  const hasQuestions = questions.some(q => q.content.trim().length > 0);

  return (
    <div className="space-y-5">
      {/* Topic */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Chủ đề Speaking</label>
        <textarea
          value={stimulus.content}
          onChange={(e) => updateStimulus({ content: e.target.value })}
          placeholder="Mô tả chủ đề cho phần thi Speaking..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Question List */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Danh sách câu hỏi ({questions.length})
        </label>
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded shrink-0">
                  Câu {i + 1}
                </span>
                <Input
                  value={q.content}
                  onChange={(e) => updateQuestion(i, { content: e.target.value })}
                  placeholder="Nhập câu hỏi Speaking..."
                  className="flex-1 h-8 text-sm"
                />
                <button type="button" onClick={() => removeQuestion(i)} className="text-gray-300 hover:text-red-500 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={q.explanation?.text || ''}
                onChange={(e) => updateQuestion(i, { explanation: { text: e.target.value } })}
                placeholder="Gợi ý / bài mẫu (tuỳ chọn)..."
                rows={2}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" className="mt-3 gap-1" onClick={addQuestion}>
          <Plus className="h-3.5 w-3.5" /> Thêm câu hỏi
        </Button>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!hasQuestions}>Tiếp theo</Button>
      </div>
    </div>
  );
}
