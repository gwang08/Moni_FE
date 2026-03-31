'use client';

import React, { useRef, useState, type ButtonHTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { QuestionEditor } from '@/components/admin/test-import-question-editor';
import { defaultMcqOptions } from '@/components/admin/test-import-question-options-mcq';
import { defaultTfngOptions } from '@/components/admin/test-import-question-options-tfng';
import { defaultFillOptions } from '@/components/admin/test-import-question-options-fill';
import { SharedOptionsEditor } from '@/components/admin/test-import-shared-options-editor';
import { MatchingTableEditor } from '@/components/admin/test-import-matching-table-editor';
import { MatchingHeadingsEditor, detectParagraphs } from '@/components/admin/test-import-matching-headings-editor';
import { MatchingInformationEditor } from '@/components/admin/test-import-matching-information-editor';
import { GapFillingEditor } from '@/components/admin/test-import-gap-filling-editor';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import type { OptionRequest, QuestionGroupRequest, QuestionRequest, QuestionTypeCode } from '@/types/admin.types';

const SHARED_OPTION_TYPES: QuestionTypeCode[] = ['MATCHING_HEADINGS', 'MATCHING_INFORMATION', 'MATCHING_FEATURE'];
const DEFAULT_SHARED_HEADINGS = [
  { label: 'A', content: '' },
  { label: 'B', content: '' },
  { label: 'C', content: '' },
  { label: 'D', content: '' },
  { label: 'E', content: '' },
  { label: 'F', content: '' },
];

interface Props {
  group: QuestionGroupRequest;
  groupIndex: number;
  positionOffset: number;
  stimulusContent?: string;
  pendingEvidence: string | null;
  onAssignEvidence: (qi: number) => void;
  onChange: (updated: QuestionGroupRequest) => void;
  onRemove: () => void;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

const QUESTION_TYPES: { value: QuestionTypeCode; label: string; instruction: string }[] = [
  { value: 'MCQ', label: 'Single Choice', instruction: 'Choose the correct letter, A, B, C or D.' },
  { value: 'MCQ_MULTIPLE', label: 'Multiple Choice', instruction: 'Choose TWO correct letters, A-E.' },
  {
    value: 'TFNG',
    label: 'True / False / Not Given',
    instruction:
      'Do the following statements agree with the information given in the reading passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.',
  },
  {
    value: 'YNNG',
    label: 'Yes / No / Not Given',
    instruction:
      'Do the following statements agree with the claims of the writer? Write YES if the statement agrees with the claims of the writer, NO if the statement contradicts the claims of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.',
  },
  {
    value: 'MATCHING_HEADINGS',
    label: 'Matching Headings',
    instruction: 'Choose the correct heading for each section from the list of headings below.',
  },
  {
    value: 'MATCHING_INFORMATION',
    label: 'Matching Information',
    instruction: 'Which paragraph contains the following information? NB You may use any letter more than once.',
  },
  {
    value: 'MATCHING_FEATURE',
    label: 'Matching Features',
    instruction: 'Look at the following statements and the list of people/categories below. Match each statement with the correct person/category.',
  },
  {
    value: 'DIAGRAM_LABEL',
    label: 'Map, Diagram Label',
    instruction: 'Label the diagram below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
  },
  {
    value: 'GAP_FILLING',
    label: 'Gap Filling',
    instruction: 'Complete the sentences below. Use __ to mark each blank.',
  },
];

function getDefaultOptions(typeCode: QuestionTypeCode): OptionRequest[] {
  switch (typeCode) {
    case 'MCQ':
    case 'MCQ_MULTIPLE':
      return defaultMcqOptions();
    case 'TFNG':
      return defaultTfngOptions('TFNG');
    case 'YNNG':
      return defaultTfngOptions('YNNG');
    case 'GAP_FILLING':
    case 'DIAGRAM_LABEL':
      return defaultFillOptions();
    case 'MATCHING_HEADINGS':
    case 'MATCHING_INFORMATION':
    case 'MATCHING_FEATURE':
      return [];
    default:
      return [];
  }
}

function emptyQuestion(typeCode: QuestionTypeCode): QuestionRequest {
  return { content: '', options: getDefaultOptions(typeCode) };
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function QuestionGroupEditor({
  group,
  groupIndex,
  positionOffset,
  stimulusContent,
  pendingEvidence,
  onAssignEvidence,
  onChange,
  onRemove,
  dragHandleProps,
}: Props) {
  const isSharedType = SHARED_OPTION_TYPES.includes(group.questionTypeCode);
  const questionScrollRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [dragQuestionIndex, setDragQuestionIndex] = useState<number | null>(null);
  const [questionDropIndex, setQuestionDropIndex] = useState<number | null>(null);

  const handleTypeChange = (typeCode: QuestionTypeCode) => {
    const matched = QUESTION_TYPES.find((t) => t.value === typeCode);
    const updatedQuestions = group.questions.map((question) => ({ ...question, options: getDefaultOptions(typeCode) }));
    const sharedOptions = SHARED_OPTION_TYPES.includes(typeCode)
      ? (group.sharedOptions?.length ? group.sharedOptions : DEFAULT_SHARED_HEADINGS)
      : undefined;

    onChange({
      ...group,
      questionTypeCode: typeCode,
      instruction: matched?.instruction,
      sharedOptions,
      questions: updatedQuestions,
    });
  };

  const addQuestion = () => {
    onChange({ ...group, questions: [...group.questions, emptyQuestion(group.questionTypeCode)] });
  };

  const removeQuestion = (questionIndex: number) => {
    onChange({ ...group, questions: group.questions.filter((_, index) => index !== questionIndex) });
  };

  const reorderQuestions = (from: number, to: number) => {
    onChange({ ...group, questions: moveItem(group.questions, from, to) });
  };

  const updateQuestion = (questionIndex: number, updated: QuestionRequest) => {
    onChange({
      ...group,
      questions: group.questions.map((question, index) => (index === questionIndex ? updated : question)),
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            draggable
            {...dragHandleProps}
            className={`inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 opacity-70 transition-opacity hover:text-blue-600 hover:opacity-100 active:cursor-grabbing ${
              dragHandleProps?.className ?? ''
            }`}
            title="Kéo để sắp xếp nhóm"
          >
            <span className="grid grid-cols-2 gap-[2px]">
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
            </span>
          </button>
          <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">Nhóm {groupIndex + 1}</span>
          <div className="min-w-[220px] flex-1">
            <Label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-400">Loại câu hỏi *</Label>
            <select
              value={group.questionTypeCode}
              onChange={(e) => handleTypeChange(e.target.value as QuestionTypeCode)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {QUESTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <Button size="icon-sm" variant="ghost" className="ml-auto h-7 w-7 text-red-500 opacity-70 transition-opacity hover:bg-red-50 hover:opacity-100" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {group.questionTypeCode === 'DIAGRAM_LABEL' && (
          <div className="space-y-2">
            <Label className="mb-1 block text-xs">Hình ảnh diagram/map</Label>
            {group.imageUrl ? (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <Image
                  src={group.imageUrl}
                  alt="Diagram preview"
                  width={960}
                  height={540}
                  unoptimized
                  className="max-h-48 w-full bg-gray-50 object-contain"
                />
                <div className="flex items-center justify-between border-t bg-gray-50 px-3 py-1.5">
                  <span className="max-w-[70%] truncate text-xs text-gray-400">{group.imageUrl}</span>
                  <button type="button" onClick={() => onChange({ ...group, imageUrl: '' })} className="text-xs text-red-500 hover:text-red-700">
                    Xóa ảnh
                  </button>
                </div>
              </div>
            ) : (
              <MediaUploadZone onUploaded={(url) => onChange({ ...group, imageUrl: url })} />
            )}
            <Input
              value={group.imageUrl ?? ''}
              onChange={(e) => onChange({ ...group, imageUrl: e.target.value })}
              placeholder="Hoặc nhập URL hình ảnh trực tiếp..."
              className="h-8 text-xs"
            />
          </div>
        )}
      </div>

      {group.questionTypeCode === 'GAP_FILLING' ? (
        <GapFillingEditor
          questions={group.questions}
          positionOffset={positionOffset}
          groupContent={group.groupContent}
          pendingEvidence={pendingEvidence}
          onAssignEvidence={onAssignEvidence}
          onGroupContentChange={(content) => onChange({ ...group, groupContent: content })}
          onChange={(questions) => onChange({ ...group, questions })}
          onBatchUpdate={(content, questions) => onChange({ ...group, groupContent: content, questions })}
        />
      ) : group.questionTypeCode === 'MATCHING_HEADINGS' ? (
        <MatchingHeadingsEditor
          paragraphs={detectParagraphs(stimulusContent || '')}
          questions={group.questions}
          pendingEvidence={pendingEvidence}
          onAssignEvidence={onAssignEvidence}
          onChange={(questions, sharedOpts) => onChange({ ...group, questions, sharedOptions: sharedOpts })}
        />
      ) : group.questionTypeCode === 'MATCHING_INFORMATION' ? (
        <MatchingInformationEditor
          paragraphs={detectParagraphs(stimulusContent || '')}
          questions={group.questions}
          pendingEvidence={pendingEvidence}
          onAssignEvidence={onAssignEvidence}
          onChange={(questions) => onChange({ ...group, questions })}
        />
      ) : isSharedType ? (
        <>
          <SharedOptionsEditor
            options={group.sharedOptions || []}
            onChange={(options) => onChange({ ...group, sharedOptions: options })}
            usageCounts={(() => {
              const counts: Record<string, number> = {};
              for (const question of group.questions) {
                const correct = question.options.find((option) => option.isCorrect);
                if (correct?.label) counts[correct.label] = (counts[correct.label] || 0) + 1;
              }
              return counts;
            })()}
          />
          <MatchingTableEditor
            questions={group.questions}
            sharedOptions={group.sharedOptions || []}
            positionOffset={positionOffset}
            pendingEvidence={pendingEvidence}
            onAssignEvidence={onAssignEvidence}
            onChange={(questions) => onChange({ ...group, questions })}
          />
        </>
      ) : (
        <div className="space-y-3">
          {group.questions.length === 0 ? (
            <button
              type="button"
              onClick={addQuestion}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white py-4 text-sm font-medium text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              Thêm câu hỏi
            </button>
          ) : (
            <>
              <div ref={questionScrollRef} className="max-h-[520px] space-y-3 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
                {group.questions.map((question, questionIndex) => (
                  <React.Fragment key={questionIndex}>
                    {dragQuestionIndex !== null && questionDropIndex === questionIndex && dragQuestionIndex !== questionIndex && (
                      <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 px-4 py-8 text-center text-xs font-medium text-blue-500">
                        Thả câu hỏi vào đây
                      </div>
                    )}
                    <div
                      ref={(el) => {
                        questionRefs.current[questionIndex] = el;
                      }}
                      data-question-key={`${groupIndex}:${questionIndex}`}
                      data-question-index={questionIndex}
                      onDragOver={(event) => {
                        if (dragQuestionIndex === null) return;
                        event.preventDefault();
                        setQuestionDropIndex(questionIndex);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (dragQuestionIndex === null) return;
                        const from = dragQuestionIndex;
                        const to = questionDropIndex ?? questionIndex;
                        if (from !== to) reorderQuestions(from, to);
                        setDragQuestionIndex(null);
                        setQuestionDropIndex(null);
                      }}
                      className="scroll-mt-3"
                    >
                      <QuestionEditor
                        question={question}
                        questionTypeCode={group.questionTypeCode}
                        position={positionOffset + questionIndex + 1}
                        pendingEvidence={pendingEvidence}
                        sharedOptions={group.sharedOptions}
                        onAssignEvidence={() => onAssignEvidence(questionIndex)}
                        onChange={(updated) => updateQuestion(questionIndex, updated)}
                        onRemove={() => removeQuestion(questionIndex)}
                        dragHandleProps={{
                          onDragStart: () => {
                            setDragQuestionIndex(questionIndex);
                            setQuestionDropIndex(questionIndex);
                          },
                          onDragEnd: () => {
                            setDragQuestionIndex(null);
                            setQuestionDropIndex(null);
                          },
                        }}
                      />
                    </div>
                  </React.Fragment>
                ))}
                {dragQuestionIndex !== null && questionDropIndex === group.questions.length && (
                  <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 px-4 py-8 text-center text-xs font-medium text-blue-500">
                    Thả câu hỏi vào cuối nhóm
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white py-4 text-sm font-medium text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Thêm câu hỏi
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

