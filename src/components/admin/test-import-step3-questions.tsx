'use client';

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

const emptyQuestion = (orderIndex: number): QuestionRequest => ({
  content: '',
  questionType: 'MULTIPLE_CHOICE',
  orderIndex,
  options: [
    { content: '', isCorrect: true, orderIndex: 0 },
    { content: '', isCorrect: false, orderIndex: 1 },
    { content: '', isCorrect: false, orderIndex: 2 },
    { content: '', isCorrect: false, orderIndex: 3 },
  ],
});

export function TestImportStep3({ stimuli, onChange, onNext, onBack }: Props) {
  const updateQuestionContent = (si: number, qi: number, value: string) => {
    onChange(stimuli.map((s, i) => i !== si ? s : {
      ...s,
      questions: s.questions.map((q, j) => j === qi ? { ...q, content: value } : q),
    }));
  };

  const addQuestion = (si: number) => {
    const updated = stimuli.map((s, i) => {
      if (i !== si) return s;
      return { ...s, questions: [...s.questions, emptyQuestion(s.questions.length)] };
    });
    onChange(updated);
  };

  const removeQuestion = (si: number, qi: number) => {
    const updated = stimuli.map((s, i) => {
      if (i !== si) return s;
      return { ...s, questions: s.questions.filter((_, j) => j !== qi).map((q, j) => ({ ...q, orderIndex: j })) };
    });
    onChange(updated);
  };

  const setOptionCorrect = (si: number, qi: number, oi: number) => {
    const updated = stimuli.map((s, i) => {
      if (i !== si) return s;
      return {
        ...s,
        questions: s.questions.map((q, j) => {
          if (j !== qi) return q;
          return { ...q, options: q.options.map((o, k) => ({ ...o, isCorrect: k === oi })) };
        }),
      };
    });
    onChange(updated);
  };

  const setOptionContent = (si: number, qi: number, oi: number, content: string) => {
    const updated = stimuli.map((s, i) => {
      if (i !== si) return s;
      return {
        ...s,
        questions: s.questions.map((q, j) => {
          if (j !== qi) return q;
          return { ...q, options: q.options.map((o, k) => k === oi ? { ...o, content } : o) };
        }),
      };
    });
    onChange(updated);
  };

  const isValid = stimuli.every(s =>
    s.questions.length > 0 &&
    s.questions.every(q => q.content.trim() && q.options.every(o => o.content.trim()) && q.options.some(o => o.isCorrect))
  );

  return (
    <div className="space-y-6">
      {stimuli.map((stimulus, si) => (
        <div key={si} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">Stimulus #{si + 1}: {stimulus.content.substring(0, 60)}...</h4>
            <Button size="sm" variant="outline" onClick={() => addQuestion(si)}>
              <Plus className="h-4 w-4" /> Thêm câu hỏi
            </Button>
          </div>

          {stimulus.questions.map((question, qi) => (
            <div key={qi} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Câu {qi + 1}</span>
                <Button size="icon-sm" variant="ghost" className="text-red-500" onClick={() => removeQuestion(si, qi)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Input value={question.content} onChange={e => updateQuestionContent(si, qi, e.target.value)}
                placeholder="Nội dung câu hỏi" />
              <div className="space-y-2">
                {question.options.map((option, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" name={`q-${si}-${qi}`} checked={option.isCorrect}
                      onChange={() => setOptionCorrect(si, qi, oi)} className="mt-0.5" />
                    <Input value={option.content} onChange={e => setOptionContent(si, qi, oi, e.target.value)}
                      placeholder={`Đáp án ${oi + 1}`} className="text-sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {stimulus.questions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Chưa có câu hỏi. Nhấn "Thêm câu hỏi".</p>
          )}
        </div>
      ))}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid}>Xem lại & Nộp</Button>
      </div>
    </div>
  );
}
