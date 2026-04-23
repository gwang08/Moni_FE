'use client';

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { EvidenceList } from '@/components/admin/evidence-list';
import { McqOptions } from '@/components/admin/test-import-question-options-mcq';
import { TfngOptions } from '@/components/admin/test-import-question-options-tfng';
import { FillOptions } from '@/components/admin/test-import-question-options-fill';
import { GapSentenceInput, extractAnswer } from '@/components/admin/gap-sentence-input';
import { updateQuestion } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { QuestionDetail } from '@/types/test.types';
import type { QuestionTypeCode, OptionRequest } from '@/types/admin.types';

export interface TestEditQuestionCardHandle {
  save: () => Promise<boolean>;
  flush: () => void;
}

interface Props {
  question: QuestionDetail;
  questionTypeCode: QuestionTypeCode;
  displayPosition?: number;
  testId: string;
  pendingEvidence: string | null;
  pendingOffset?: number;
  pendingStartOffset?: number;
  pendingEndOffset?: number;
  pendingStartTime?: number | null;
  onAssignEvidence: () => void;
  onEvidenceChange: (evidence: string, offsets: number[], startOffsets?: number[], endOffsets?: number[], startTimes?: number[]) => void;
}

export const TestEditQuestionCard = forwardRef<TestEditQuestionCardHandle, Props>(function TestEditQuestionCard(
  {
    question,
    questionTypeCode,
    displayPosition,
    testId,
    pendingEvidence,
    pendingOffset,
    pendingStartOffset,
    pendingEndOffset,
    pendingStartTime,
    onAssignEvidence,
    onEvidenceChange,
  },
  ref
) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [content, setContent] = useState(question.content);
  const [options, setOptions] = useState<OptionRequest[]>(
    question.options.map((option) => ({
      label: option.label,
      content: option.content,
      isCorrect: option.isCorrect,
    })),
  );
  const [explanationText, setExplanationText] = useState(question.explanation?.text ?? '');
  const [evidence, setEvidence] = useState(question.explanation?.evidence ?? '');
  const [offsets, setOffsets] = useState<number[]>(question.explanation?.offsets ?? []);
  const [startOffsets, setStartOffsets] = useState<number[]>(question.explanation?.startOffsets ?? []);
  const [endOffsets, setEndOffsets] = useState<number[]>(question.explanation?.endOffsets ?? []);
  const [startTimes, setStartTimes] = useState<number[]>(question.explanation?.startTimes ?? []);
  const isGapType = questionTypeCode === 'GAP_FILLING';
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef('');
  const isDirtyRef = useRef(false);

  const handleEvidenceChange = (
    ev: string | undefined,
    nextOffsets: number[] | undefined,
    nextStartOffsets?: number[],
    nextEndOffsets?: number[],
    nextStartTimes?: number[]
  ) => {
    const nextEvidence = ev ?? '';
    const finalOffsets = nextOffsets ?? [];
    const finalStartOffsets = nextStartOffsets ?? [];
    const finalEndOffsets = nextEndOffsets ?? [];
    const finalStartTimes = nextStartTimes ?? [];

    setEvidence(nextEvidence);
    setOffsets(finalOffsets);
    setStartOffsets(finalStartOffsets);
    setEndOffsets(finalEndOffsets);
    setStartTimes(finalStartTimes);
    onEvidenceChange(nextEvidence, finalOffsets, finalStartOffsets, finalEndOffsets, finalStartTimes);
  };

  const saveQuestion = async (): Promise<boolean> => {
    const snapshot = JSON.stringify({
      content,
      options,
      explanationText,
      evidence,
      offsets,
      startOffsets,
      endOffsets,
      startTimes,
    });
    if (snapshot === lastSavedRef.current && !isDirtyRef.current) return true;

    // Clear any pending auto-save timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    try {
      await updateQuestion(String(question.id), {
        content,
        options,
        explanation: {
          text: explanationText || undefined,
          evidence: evidence || undefined,
          offsets: offsets.length > 0 ? offsets : undefined,
          startOffsets: startOffsets.length > 0 ? startOffsets : undefined,
          endOffsets: endOffsets.length > 0 ? endOffsets : undefined,
          startTimes: startTimes.length > 0 ? startTimes : undefined,
        },
      });
      lastSavedRef.current = snapshot;
      isDirtyRef.current = false;
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
      return true;
    } catch {
      toast.error(`Lưu câu ${displayPosition ?? question.position} thất bại`);
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    save: saveQuestion,
    flush: () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    },
  }));

  useEffect(() => {
    const snapshot = JSON.stringify({
      content,
      options,
      explanationText,
      evidence,
      offsets,
    });

    if (!lastSavedRef.current) {
      lastSavedRef.current = snapshot;
      return;
    }

    if (snapshot === lastSavedRef.current) return;

    isDirtyRef.current = true;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      await saveQuestion();
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [content, evidence, offsets, explanationText, options, queryClient, question.id, testId]);

  const correctAnswer = question.options.find((option) => option.isCorrect);
  const correctLabel = correctAnswer?.label || correctAnswer?.content || '—';

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        )}
        <span className="shrink-0 font-medium text-gray-700">Câu {displayPosition ?? question.position}</span>
        <span className="flex-1 truncate text-gray-500">{question.content.replace(/\{\{(.+?)\}\}/g, '___')}</span>
        <span className="shrink-0 rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-600">{correctLabel}</span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-gray-100 px-3 pb-3 pt-1">
          {isGapType ? (
            <GapSentenceInput
              value={content}
              onChange={(val) => {
                setContent(val);
                const answer = extractAnswer(val);
                setOptions([{ label: '', content: answer, isCorrect: true }]);
              }}
            />
          ) : (
            <>
              <div>
                <Label className="mb-1 block text-xs text-gray-500">Nội dung câu hỏi</Label>
                <Input value={content} onChange={(e) => setContent(e.target.value)} className="text-sm" />
              </div>
              {(questionTypeCode === 'MCQ' || questionTypeCode === 'MCQ_MULTIPLE') && (
                <McqOptions options={options} onChange={setOptions} multiple={questionTypeCode === 'MCQ_MULTIPLE'} />
              )}
              {(questionTypeCode === 'TFNG' || questionTypeCode === 'YNNG') && (
                <TfngOptions options={options} onChange={setOptions} variant={questionTypeCode} />
              )}
              {questionTypeCode === 'DIAGRAM_LABEL' && <FillOptions options={options} onChange={setOptions} variant={questionTypeCode} />}
            </>
          )}

          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-2">
            <div>
              <Label className="mb-1 block text-xs text-gray-500">Giải thích</Label>
              <textarea
                value={explanationText}
                onChange={(e) => setExplanationText(e.target.value)}
                placeholder="Tại sao đáp án này đúng?"
                rows={2}
                className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <EvidenceList
              evidence={evidence}
              offsets={offsets}
              startOffsets={startOffsets}
              endOffsets={endOffsets}
              startTimes={startTimes}
              pendingEvidence={pendingEvidence}
              pendingOffset={pendingOffset}
              pendingStartOffset={pendingStartOffset}
              pendingEndOffset={pendingEndOffset}
              pendingStartTime={pendingStartTime}
              onAssign={onAssignEvidence}
              onChange={handleEvidenceChange}
            />
          </div>
        </div>
      )}
    </div>
  );
});
