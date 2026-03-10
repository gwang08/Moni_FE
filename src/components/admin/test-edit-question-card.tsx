'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ChevronDown, ChevronRight, Highlighter } from 'lucide-react';
import { McqOptions } from '@/components/admin/test-import-question-options-mcq';
import { TfngOptions } from '@/components/admin/test-import-question-options-tfng';
import { FillOptions } from '@/components/admin/test-import-question-options-fill';
import { MatchingOptions } from '@/components/admin/test-import-question-options-matching';
import { updateQuestion } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { QuestionDetail } from '@/types/test.types';
import type { QuestionTypeCode, OptionRequest } from '@/types/admin.types';

interface Props {
  question: QuestionDetail;
  questionTypeCode: QuestionTypeCode;
  testId: string;
  pendingEvidence: string | null;
  onAssignEvidence: () => void;
  onEvidenceChange: (evidence: string) => void;
}

export function TestEditQuestionCard({ question, questionTypeCode, testId, pendingEvidence, onAssignEvidence, onEvidenceChange }: Props) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState(question.content);
  const [options, setOptions] = useState<OptionRequest[]>(
    question.options.map(o => ({ label: o.label, content: o.content, isCorrect: o.isCorrect }))
  );
  const [explanationText, setExplanationText] = useState(question.explanation?.text ?? '');
  const [evidence, setEvidence] = useState(question.explanation?.evidence ?? '');

  const handleAssign = () => {
    if (!pendingEvidence) return;
    setEvidence(pendingEvidence);
    onEvidenceChange(pendingEvidence);
    onAssignEvidence();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateQuestion(String(question.id), {
        content,
        options,
        explanation: { text: explanationText || undefined, evidence: evidence || undefined },
      });
      toast.success(`Câu ${question.position} đã lưu`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const correctAnswer = question.options.find(o => o.isCorrect);
  const correctLabel = correctAnswer?.label || correctAnswer?.content || '—';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        type="button" onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 text-sm"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
        <span className="font-medium text-gray-700 shrink-0">Câu {question.position}</span>
        <span className="text-gray-500 truncate flex-1">{question.content}</span>
        <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded shrink-0">{correctLabel}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-100">
          <div>
            <Label className="mb-1 block text-xs text-gray-500">Nội dung câu hỏi</Label>
            <Input value={content} onChange={e => setContent(e.target.value)} className="text-sm" />
          </div>

          {(questionTypeCode === 'MCQ' || questionTypeCode === 'MCQ_MULTIPLE') && (
            <McqOptions options={options} onChange={setOptions} />
          )}
          {(questionTypeCode === 'TFNG' || questionTypeCode === 'YNNG') && (
            <TfngOptions options={options} onChange={setOptions} variant={questionTypeCode} />
          )}
          {(questionTypeCode === 'FILL_IN_THE_BLANK' || questionTypeCode === 'SHORT_ANSWER') && (
            <FillOptions options={options} onChange={setOptions} variant={questionTypeCode} />
          )}
          {questionTypeCode === 'MATCHING' && (
            <MatchingOptions options={options} onChange={setOptions} />
          )}

          {/* Explanation + Evidence */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <Label className="mb-1 block text-xs text-gray-500">Giải thích</Label>
              <textarea
                value={explanationText} onChange={e => setExplanationText(e.target.value)}
                placeholder="Tại sao đáp án này đúng?" rows={2}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="block text-xs text-gray-500">Dẫn chứng</Label>
                {pendingEvidence && (
                  <Button type="button" size="sm" variant="default" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={handleAssign}>
                    <Highlighter className="h-2.5 w-2.5" /> Gán vào câu này
                  </Button>
                )}
              </div>
              {evidence ? (
                <div className="relative rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900 whitespace-pre-wrap max-h-20 overflow-y-auto">
                  {evidence}
                  <button type="button" onClick={() => { setEvidence(''); onEvidenceChange(''); }} className="absolute top-0.5 right-1 text-amber-400 hover:text-amber-600 text-xs">✕</button>
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 italic pt-1">Quét text bài đọc bên phải → bấm &quot;Gán vào câu này&quot;</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Lưu câu {question.position}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
