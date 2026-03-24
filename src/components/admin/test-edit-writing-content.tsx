'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import HighlightExt from '@tiptap/extension-highlight';
import { Table as TableExtension } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { RichTextToolbar } from '@/components/admin/rich-text-toolbar';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { updateStimulus, updateQuestion, updateQuestionGroupContent, updateQuestionGroupTypeCode } from '@/lib/admin-api';
import {
  WRITING_TASK1_TYPES,
  WRITING_TASK1_TYPE_CODES,
  WRITING_TASK2_TYPES,
  WRITING_TASK2_TYPE_CODES,
  WRITING_TOPICS,
  WRITING_TYPE_CODE_LABELS,
} from '@/components/practice/writing-filter-constants';
import type { TestDetailResponse } from '@/types/test.types';

const EDITOR_EXTENSIONS = [
  StarterKit,
  Placeholder.configure({ placeholder: 'Nhập đề bài Writing (có thể chèn ảnh biểu đồ)...' }),
  Underline,
  Subscript,
  Superscript,
  HighlightExt.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  LinkExtension.configure({ openOnClick: false }),
  ImageExtension,
  TableExtension.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
];

const SAMPLE_FIELDS = [
  { key: 'introduction', label: 'Introduction', placeholder: 'Đoạn mở bài mẫu...', rows: 3 },
  { key: 'overview', label: 'Overview', placeholder: 'Đoạn tổng quan mẫu...', rows: 3 },
  { key: 'body1', label: 'Body 1', placeholder: 'Đoạn thân bài 1 mẫu...', rows: 4 },
  { key: 'body2', label: 'Body 2', placeholder: 'Đoạn thân bài 2 mẫu...', rows: 4 },
];

const SEPARATOR = '\n---SECTION---\n';

function parseSample(raw: string): Record<string, string> {
  const parts = raw.split(SEPARATOR);
  return {
    introduction: parts[0]?.trim() || '',
    overview: parts[1]?.trim() || '',
    body1: parts[2]?.trim() || '',
    body2: parts[3]?.trim() || '',
  };
}

function buildSample(fields: Record<string, string>): string {
  return [fields.introduction, fields.overview, fields.body1, fields.body2]
    .map((s) => s || '')
    .join(SEPARATOR);
}

interface Props {
  test: TestDetailResponse;
}

export function TestEditWritingContent({ test }: Props) {
  const queryClient = useQueryClient();
  const testId = String(test.id);
  const stimulus = test.stimuli[0];
  const firstGroup = stimulus?.questionGroups[0];
  const [saving, setSaving] = useState(false);
  const [contentHtml, setContentHtml] = useState(stimulus?.content || '');

  // Read bài mẫu from instruction (create flow) or explanation.text (edit flow)
  const firstQuestion = firstGroup?.questions[0];
  const rawSample = firstGroup?.instruction || (firstQuestion?.explanation as { text?: string })?.text || '';
  const [sampleFields, setSampleFields] = useState<Record<string, string>>(() => parseSample(rawSample));

  // Writing type/topic state — initialized from existing data
  const [questionTypeCode, setQuestionTypeCode] = useState(firstGroup?.questionTypeCode || '');
  const [topic, setTopic] = useState(firstGroup?.groupContent || '');

  // Determine section from test
  const section = test.section;
  const isTask1 = section === 1;
  const isTask2 = section === 2;
  const typeOptions = isTask1 ? WRITING_TASK1_TYPES : isTask2 ? WRITING_TASK2_TYPES : [];
  const typeCodes = isTask1 ? WRITING_TASK1_TYPE_CODES : isTask2 ? WRITING_TASK2_TYPE_CODES : {};

  // Reverse lookup: code → label for the select value
  const codeToLabel: Record<string, string> = Object.fromEntries(
    Object.entries(typeCodes).map(([label, code]) => [code, label])
  );
  const selectedTypeLabel = codeToLabel[questionTypeCode] || '';

  const handleTypeChange = (label: string) => {
    const code = typeCodes[label] || '';
    setQuestionTypeCode(code);
  };

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: stimulus?.content || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] focus:outline-none p-4',
      },
    },
    onUpdate: ({ editor: ed }) => {
      setContentHtml(ed.getHTML());
    },
  });

  if (!stimulus) return <p className="text-gray-400 text-center py-8">Chưa có nội dung</p>;

  const updateSampleField = (key: string, value: string) => {
    setSampleFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStimulus(stimulus.id, {
        content: contentHtml,
        mediaUrl: stimulus.mediaUrl || undefined,
      });

      // Save bài mẫu into first question's explanation
      const firstQuestion = firstGroup?.questions[0];
      const sampleText = buildSample(sampleFields);
      if (firstQuestion && sampleText.replace(/\n---SECTION---\n/g, '').trim()) {
        await updateQuestion(String(firstQuestion.id), {
          explanation: { text: sampleText },
        });
      }

      // Save writing type code if group exists and type changed
      if (firstGroup && questionTypeCode && questionTypeCode !== firstGroup.questionTypeCode) {
        await updateQuestionGroupTypeCode(firstGroup.id, questionTypeCode);
      }

      // Save topic (groupContent) if group exists and topic changed
      if (firstGroup && topic !== (firstGroup.groupContent || '')) {
        await updateQuestionGroupContent(firstGroup.id, topic);
      }

      toast.success('Đã lưu nội dung Writing');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Dạng đề — chỉ hiện cho Task 1 hoặc Task 2 */}
      {(isTask1 || isTask2) && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Dạng đề
            {questionTypeCode && (
              <span className="ml-2 text-xs text-blue-600 font-normal">
                {WRITING_TYPE_CODE_LABELS[questionTypeCode] || questionTypeCode}
              </span>
            )}
          </label>
          <select
            value={selectedTypeLabel}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn dạng đề --</option>
            {typeOptions.map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Chủ đề — chỉ hiện cho Task 2 */}
      {isTask2 && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Chủ đề</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn chủ đề --</option>
            {WRITING_TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {/* Đề bài - Rich Text Editor */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Đề bài Writing
          <span className="text-xs text-gray-400 font-normal ml-2">Có thể chèn ảnh biểu đồ trực tiếp vào đề</span>
        </label>
        <div className="border border-input rounded-md bg-white overflow-hidden">
          <RichTextToolbar editor={editor} />
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Bài mẫu - 4 fields */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-3 block">Bài mẫu</label>
        <div className="space-y-3">
          {SAMPLE_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{field.label}</label>
              <textarea
                value={sampleFields[field.key] || ''}
                onChange={(e) => updateSampleField(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={field.rows}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Lưu
        </Button>
      </div>
    </div>
  );
}
