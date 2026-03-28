'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, X } from 'lucide-react';
import { createQuestionGroup } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { TestEditQuestionDraftCard } from '@/components/admin/test-edit-question-draft-card';
import { MatchingInformationEditor } from '@/components/admin/test-import-matching-information-editor';
import { SharedOptionsEditor } from '@/components/admin/test-import-shared-options-editor';
import { MatchingTableEditor } from '@/components/admin/test-import-matching-table-editor';
import { detectParagraphs } from '@/components/admin/test-import-matching-headings-editor';
import { defaultOptions } from '@/lib/question-defaults';
import type { QuestionTypeCode, OptionRequest } from '@/types/admin.types';

const QUESTION_TYPES: { value: QuestionTypeCode; label: string }[] = [
  { value: 'MCQ', label: 'Multiple Choice (One Answer)' },
  { value: 'MCQ_MULTIPLE', label: 'Multiple Choice (Many Answers)' },
  { value: 'TFNG', label: 'True / False / Not Given' },
  { value: 'YNNG', label: 'Yes / No / Not Given' },
  { value: 'GAP_FILLING', label: 'Gap Filling' },
  { value: 'MATCHING_HEADINGS', label: 'Matching Headings' },
  { value: 'MATCHING_INFORMATION', label: 'Matching Information' },
  { value: 'MATCHING_FEATURE', label: 'Matching Features' },
  { value: 'DIAGRAM_LABEL', label: 'Map, Diagram Label' },
];

export interface QuestionDraft {
  content: string;
  options: OptionRequest[];
  explanation?: { text?: string; evidence?: string };
}

interface Props {
  stimulusId: number;
  testId: string;
  stimulusContent?: string;
  excludeTypeCodes?: QuestionTypeCode[];
  pendingEvidence?: string | null;
  onAssignEvidence?: () => void;
  onClose: () => void;
}

export function TestEditAddQuestionGroupForm({ stimulusId, testId, stimulusContent, excludeTypeCodes = [], pendingEvidence, onAssignEvidence, onClose }: Props) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [instruction, setInstruction] = useState('');
  const availableTypes = QUESTION_TYPES.filter(t => !excludeTypeCodes.includes(t.value));
  const [typeCode, setTypeCode] = useState<QuestionTypeCode>(availableTypes[0]?.value ?? 'MCQ');
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { content: '', options: defaultOptions(availableTypes[0]?.value ?? 'MCQ') },
  ]);

  const DEFAULT_CATEGORIES = [
    { label: 'A', content: '' }, { label: 'B', content: '' }, { label: 'C', content: '' },
  ];
  const [sharedOptions, setSharedOptions] = useState<{ label: string; content: string }[]>(DEFAULT_CATEGORIES);

  const handleTypeChange = (code: QuestionTypeCode) => {
    setTypeCode(code);
    setQuestions([{ content: '', options: defaultOptions(code) }]);
    if (code === 'MATCHING_FEATURE') setSharedOptions(DEFAULT_CATEGORIES);
  };

  const addQuestion = () => {
    setQuestions(q => [...q, { content: '', options: defaultOptions(typeCode) }]);
  };

  const removeQuestion = (i: number) => {
    setQuestions(q => q.filter((_, j) => j !== i));
  };

  const updateQuestion = (i: number, draft: QuestionDraft) => {
    setQuestions(q => q.map((d, j) => (j === i ? draft : d)));
  };

  const handleSubmit = async () => {
    if (!questions.length || questions.every(q => !q.content.trim())) {
      toast.error('Vui lòng nhập ít nhất 1 câu hỏi');
      return;
    }
    setSaving(true);
    try {
      await createQuestionGroup(stimulusId, {
        instruction: instruction || undefined,
        questionTypeCode: typeCode,
        questions: questions.map((q, i) => ({
          content: q.content,
          position: i + 1,
          options: q.options,
          explanation: q.explanation?.text || q.explanation?.evidence ? q.explanation : undefined,
        })),
      });
      toast.success('Đã thêm nhóm câu hỏi');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
      onClose();
    } catch {
      toast.error('Thêm nhóm thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/30 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-semibold text-blue-700">Thêm nhóm câu hỏi</h5>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1 block text-xs text-gray-600">Loại câu hỏi *</Label>
          <select value={typeCode} onChange={e => handleTypeChange(e.target.value as QuestionTypeCode)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {availableTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <Label className="mb-1 block text-xs text-gray-600">Hướng dẫn</Label>
          <Input value={instruction} onChange={e => setInstruction(e.target.value)}
            placeholder="VD: Choose the correct letter..." className="text-xs h-7" />
        </div>
      </div>

      {typeCode === 'MATCHING_FEATURE' ? (
        <div className="space-y-3">
          <SharedOptionsEditor
            options={sharedOptions}
            onChange={setSharedOptions}
          />
          <MatchingTableEditor
            questions={questions.map((q, i) => ({ content: q.content, options: q.options, position: i + 1 }))}
            sharedOptions={sharedOptions}
            positionOffset={0}
            onChange={qs => setQuestions(qs.map(q => ({ content: q.content, options: q.options })))}
          />
        </div>
      ) : typeCode === 'MATCHING_INFORMATION' ? (
        <MatchingInformationEditor
          paragraphs={detectParagraphs(stimulusContent || '')}
          questions={questions.map((q, i) => ({ content: q.content, options: q.options, explanation: q.explanation, position: i + 1 }))}
          pendingEvidence={pendingEvidence ?? null}
          onAssignEvidence={(qi) => {
            if (pendingEvidence) {
              updateQuestion(qi, { ...questions[qi], explanation: { ...questions[qi].explanation, evidence: pendingEvidence } });
              onAssignEvidence?.();
            }
          }}
          onChange={qs => setQuestions(qs.map(q => ({ content: q.content, options: q.options, explanation: q.explanation })))}
        />
      ) : (
        <>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {questions.map((q, i) => (
              <TestEditQuestionDraftCard key={i} index={i} draft={q} typeCode={typeCode}
                pendingEvidence={pendingEvidence}
                onAssignEvidence={() => onAssignEvidence?.()}
                onChange={d => updateQuestion(i, d)} onRemove={questions.length > 1 ? () => removeQuestion(i) : undefined} />
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button type="button" size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={addQuestion}>
              <Plus className="h-3 w-3" /> Thêm câu
            </Button>
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onClose}>Hủy</Button>
          <Button type="button" size="sm" className="h-7 text-xs" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            Tạo nhóm
          </Button>
        </div>
      </div>
    </div>
  );
}
