'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
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
import { Loader2, Save, ScanSearch, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  updateStimulus,
  updateQuestion,
  updateQuestionGroupContent,
  updateQuestionGroupTypeCode,
  analyzeChart as analyzeChartApi,
  getVisonAnalysis,
  updateVisonAnalysis,
  createQuestionGroup,
  createQuestion,
} from '@/lib/admin-api';
import { ChartDataEditor } from '@/components/admin/chart-data-editor';
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

const SEPARATOR = '\n---SECTION---\n';

function parseSample(raw: string): string {
  if (!raw) return '';
  // Convert old multi-section format to single string if needed
  return raw.split(SEPARATOR).filter(s => s.trim()).join('\n\n').trim();
}

function buildSample(content: string): string {
  return content.trim();
}

/**
 * Strip thẻ <img> có src="blob:" khỏi HTML
 */
function stripDeadBlobImages(html: string): string {
  return html.replace(/<img\b[^>]*\bsrc=["']blob:[^"']*["'][^>]*>/gi, '');
}

interface Props {
  test: TestDetailResponse;
}

export interface TestEditWritingContentHandle {
  saveAll: (silent?: boolean) => Promise<boolean>;
}

export const TestEditWritingContent = forwardRef<TestEditWritingContentHandle, Props>(function TestEditWritingContent({ test }: Props, ref) {
  const queryClient = useQueryClient();
  const testId = String(test.id);
  const stimulus = test.stimuli[0];
  const firstGroup = stimulus?.questionGroups[0];
  const [saving, setSaving] = useState(false);
  const [contentHtml, setContentHtml] = useState(() => stripDeadBlobImages(stimulus?.content || ''));
  const [imageUploading, setImageUploading] = useState(false);

  // Read bài mẫu from instruction (create flow) or explanation.text (edit flow)
  const firstQuestion = firstGroup?.questions[0];
  const rawSample = firstGroup?.instruction || (firstQuestion?.explanation as { text?: string })?.text || '';
  const [sampleContent, setSampleContent] = useState<string>(() => parseSample(rawSample));

  // Writing type/topic state
  const [questionTypeCode, setQuestionTypeCode] = useState(firstGroup?.questionTypeCode || '');
  const [topic, setTopic] = useState(firstGroup?.groupContent || '');

  // Determine section from test
  const section = test.section;
  const isTask1 = section === 1;
  const isTask2 = section === 2;
  const typeCodes = isTask1 ? WRITING_TASK1_TYPE_CODES : isTask2 ? WRITING_TASK2_TYPE_CODES : {};

  // Chart analysis state (Task 1 only)
  const [chartDataJson, setChartDataJson] = useState('');
  const [chartAnalyzing, setChartAnalyzing] = useState(false);
  const [chartSaving, setChartSaving] = useState(false);
  const [chartJsonError, setChartJsonError] = useState<string | null>(null);
  const chartFileRef = useRef<HTMLInputElement>(null);

  // Load existing chart analysis
  useEffect(() => {
    if (!isTask1 || !stimulus) return;
    getVisonAnalysis(stimulus.id).then((data) => {
      if (data && Object.keys(data).length > 0) {
        setChartDataJson(JSON.stringify(data, null, 2));
      }
    }).catch(() => {});
  }, [isTask1, stimulus]);

  const handleAnalyzeChart = async () => {
    const file = chartFileRef.current?.files?.[0];
    if (!file) {
      toast.error('Vui lòng chọn ảnh biểu đồ trước');
      return;
    }
    setChartAnalyzing(true);
    try {
      const result = await analyzeChartApi(stimulus.id, file);
      setChartDataJson(JSON.stringify(result, null, 2));
      setChartJsonError(null);
      toast.success('Phân tích biểu đồ thành công!');
    } catch {
      toast.error('Phân tích biểu đồ thất bại');
    } finally {
      setChartAnalyzing(false);
    }
  };

  const handleSaveChartData = async () => {
    try {
      const parsed = JSON.parse(chartDataJson);
      setChartJsonError(null);
      setChartSaving(true);
      await updateVisonAnalysis(stimulus.id, parsed);
      toast.success('Đã lưu dữ liệu biểu đồ');
    } catch {
      setChartJsonError('JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.');
    } finally {
      setChartSaving(false);
    }
  };

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: stripDeadBlobImages(stimulus?.content || ''),
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

  const doSave = async (silent = false): Promise<boolean> => {
    if (!stimulus) return true;
    if (imageUploading || /src="blob:/.test(contentHtml)) {
      if (!silent) toast.error('Ảnh đang được tải lên, vui lòng chờ xong rồi lưu');
      return false;
    }

    setSaving(true);
    try {
      await updateStimulus(stimulus.id, {
        content: contentHtml,
        mediaUrl: stimulus.mediaUrl || undefined,
      });

      const sampleText = buildSample(sampleContent);
      const hasSample = sampleText.trim().length > 0;
      
      if (hasSample) {
        let questionId = firstGroup?.questions[0]?.id;
        if (!questionId) {
          const groupId = firstGroup?.id
            ?? (await createQuestionGroup(stimulus.id, {
              questionTypeCode: isTask2 ? 'WRITING_TASK_2' : 'WRITING_TASK_1',
              questions: [],
            }));
          questionId = await createQuestion(groupId, {
            content: 'Writing sample',
            options: [],
          });
        }
        await updateQuestion(String(questionId), { explanation: { text: sampleText } });
      }

      if (firstGroup && questionTypeCode && questionTypeCode !== firstGroup.questionTypeCode) {
        await updateQuestionGroupTypeCode(firstGroup.id, questionTypeCode);
      }

      if (firstGroup && topic !== (firstGroup.groupContent || '')) {
        await updateQuestionGroupContent(firstGroup.id, topic);
      }

      if (!silent) toast.success('Đã lưu nội dung Writing');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
      return true;
    } catch {
      if (!silent) toast.error('Lưu thất bại');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    saveAll: (silent?: boolean) => doSave(silent),
  }));

  if (!stimulus) return <p className="text-gray-400 text-center py-8">Chưa có nội dung</p>;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Đề bài - Rich Text Editor */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Đề bài Writing
          <span className="text-xs text-gray-400 font-normal ml-2">Có thể chèn ảnh biểu đồ trực tiếp vào đề</span>
        </label>
        <div className="border border-input rounded-md bg-white overflow-hidden">
          <RichTextToolbar editor={editor} onUploadingChange={setImageUploading} />
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Chart Analysis (Task 1 only) */}
      {isTask1 && (
        <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4 space-y-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <ScanSearch className="h-4 w-4 text-amber-600" />
            Phân tích biểu đồ (Task 1)
            <span className="text-xs text-gray-400 font-normal">AI sẽ trích xuất dữ liệu số từ ảnh biểu đồ</span>
          </label>

          <div className="flex items-center gap-3">
            <input
              ref={chartFileRef}
              type="file"
              accept="image/*"
              className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
            />
            <Button
              onClick={handleAnalyzeChart}
              disabled={chartAnalyzing}
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              {chartAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ScanSearch className="h-3.5 w-3.5 mr-1" />}
              Phân tích (AI)
            </Button>
          </div>

          {chartDataJson && (
            <div className="space-y-3">
              <ChartDataEditor
                data={chartDataJson}
                onChange={setChartDataJson}
              />
              {chartJsonError && (
                <div className="flex items-center gap-1.5 text-red-600 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {chartJsonError}
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={handleSaveChartData} disabled={chartSaving} size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                  {chartSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Lưu dữ liệu biểu đồ
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bài mẫu - 1 field */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-3 block">Bài mẫu</label>
        <textarea
          value={sampleContent}
          onChange={(e) => setSampleContent(e.target.value)}
          placeholder="Nhập bài mẫu Writing..."
          rows={12}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

    </div>
  );
});
