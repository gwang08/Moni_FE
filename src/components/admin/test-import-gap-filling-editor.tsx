'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { GapSentenceInput, extractAnswer } from '@/components/admin/gap-sentence-input';
import { EvidenceList, appendEvidence } from '@/components/admin/evidence-list';
import type { QuestionRequest } from '@/types/admin.types';

interface Props {
  questions: QuestionRequest[];
  positionOffset: number;
  groupContent?: string;
  pendingEvidence: string | null;
  onAssignEvidence: (qi: number) => void;
  onGroupContentChange?: (content: string) => void;
  onChange: (questions: QuestionRequest[]) => void;
}

export function GapFillingEditor({
  questions, positionOffset, groupContent, pendingEvidence,
  onAssignEvidence, onGroupContentChange, onChange,
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [mode, setMode] = useState<'sentence' | 'paragraph'>(groupContent ? 'paragraph' : 'sentence');

  const addQuestion = () => {
    onChange([...questions, { content: '', options: [{ label: '', content: '', isCorrect: true }] }]);
  };

  const removeQuestion = (idx: number) => {
    onChange(questions.filter((_, i) => i !== idx));
  };

  const updateContent = (idx: number, content: string) => {
    const answer = extractAnswer(content);
    const options = [{ label: '', content: answer, isCorrect: true }];
    onChange(questions.map((q, i) => (i === idx ? { ...q, content, options } : q)));
  };

  const updateExplanation = (idx: number, text: string) => {
    onChange(questions.map((q, i) =>
      i === idx ? { ...q, explanation: { ...q.explanation, text: text || undefined } } : q
    ));
  };

  const handleEvidenceChange = (idx: number, ev: string | undefined) => {
    onChange(questions.map((q, i) =>
      i === idx ? { ...q, explanation: { ...q.explanation, evidence: ev } } : q
    ));
  };

  const updateAnswer = (idx: number, answer: string) => {
    onChange(questions.map((q, i) =>
      i === idx ? { ...q, options: [{ label: '', content: answer, isCorrect: true }] } : q
    ));
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 p-0.5 bg-gray-100 rounded-md w-fit">
        <button type="button" onClick={() => setMode('sentence')}
          className={`px-2.5 py-1 text-[11px] rounded transition-colors ${mode === 'sentence' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          Câu lẻ
        </button>
        <button type="button" onClick={() => setMode('paragraph')}
          className={`px-2.5 py-1 text-[11px] rounded transition-colors ${mode === 'paragraph' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          Đoạn văn
        </button>
      </div>

      {/* Paragraph mode: groupContent textarea */}
      {mode === 'paragraph' && (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500">
            Nhập đoạn văn, dùng <strong>__</strong> hoặc <strong>…</strong> để đánh dấu chỗ trống, kèm số thứ tự câu (VD: <em>&quot;it uses its <strong>10</strong> ………. to smell&quot;</em>)
          </p>
          <textarea
            value={groupContent ?? ''}
            onChange={e => onGroupContentChange?.(e.target.value)}
            placeholder="A shark is a very effective hunter. Firstly, it uses its 10 ……….. to smell its target. When the shark gets close, it uses 11 ……….. to guide it toward an accurate attack."
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          />
        </div>
      )}

      {/* Questions list */}
      <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {questions.map((q, idx) => {
          const isOpen = expanded === idx;
          const expl = q.explanation;
          const hasDetail = !!(expl?.text || expl?.evidence);
          const answer = q.options.find(o => o.isCorrect)?.content ?? '';

          return (
            <div key={idx} className="bg-white">
              {/* Question row */}
              <div className="px-3 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Câu {positionOffset + idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setExpanded(isOpen ? null : idx)}
                      className={`flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 ${hasDetail ? 'text-amber-500' : 'text-gray-300'}`}
                      title="Giải thích & dẫn chứng">
                      {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(idx)} className="text-gray-300 hover:text-red-500 h-7 w-7 flex items-center justify-center">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {mode === 'sentence' ? (
                  <GapSentenceInput
                    value={q.content}
                    onChange={val => updateContent(idx, val)}
                    placeholder="VD: The tomato is thought to have first grown in the Americas."
                  />
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      value={answer}
                      onChange={e => updateAnswer(idx, e.target.value)}
                      placeholder="Đáp án (nhiều đáp án cách bằng |)"
                      className="text-sm h-8"
                    />
                    {answer && (
                      <p className="text-[10px] text-green-700">
                        Đáp án: <strong>{answer.split('|')[0]}</strong>
                        {answer.includes('|') && <span className="text-gray-400 ml-1">(+{answer.split('|').length - 1} đáp án khác)</span>}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Explanation + Evidence panel */}
              {isOpen && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-2 border-t border-dashed border-gray-100">
                  <div className="pt-2">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Giải thích</span>
                    <textarea
                      value={expl?.text ?? ''} onChange={e => updateExplanation(idx, e.target.value)}
                      placeholder="Tại sao đáp án này đúng?" rows={2}
                      className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="pt-2">
                    <EvidenceList
                      evidence={expl?.evidence}
                      pendingEvidence={pendingEvidence}
                      onAssign={() => onAssignEvidence(idx)}
                      onChange={ev => handleEvidenceChange(idx, ev)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button type="button" size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={addQuestion}>
        <Plus className="h-3 w-3" /> Thêm câu
      </Button>
    </div>
  );
}
