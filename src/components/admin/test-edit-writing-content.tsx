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
import { updateStimulus, updateQuestion } from '@/lib/admin-api';
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
  const [saving, setSaving] = useState(false);
  const [contentHtml, setContentHtml] = useState(stimulus?.content || '');

  const rawSample = stimulus?.questionGroups[0]?.instruction || '';
  const [sampleFields, setSampleFields] = useState<Record<string, string>>(() => parseSample(rawSample));

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

      const firstQuestion = stimulus.questionGroups[0]?.questions[0];
      const sampleText = buildSample(sampleFields);
      if (firstQuestion && sampleText.replace(/\n---SECTION---\n/g, '').trim()) {
        await updateQuestion(String(firstQuestion.id), {
          explanation: { text: sampleText },
        });
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
