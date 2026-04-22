'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
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
import { Loader2, Save, ScanSearch, AlertTriangle, Image as ImageIcon, Plus } from 'lucide-react';
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
  uploadMedia,
  urlToFile,
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

const SAMPLE_EDITOR_EXTENSIONS = [
  StarterKit,
  Placeholder.configure({ placeholder: 'Nhập bài mẫu Writing...' }),
  Underline,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  LinkExtension.configure({ openOnClick: false }),
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
 * Strip thẻ <img> khỏi HTML cho Task 1 (vì đã có field riêng) hoặc các blob URL
 */
function stripRedundantImages(html: string, isTask1: boolean): string {
  if (isTask1) {
    // Strip ALL images for Task 1 as they should be in the media field
    return html.replace(/<img\b[^>]*>/gi, '');
  }
  // For others, only strip RAM-only blobs
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

  // Determine section from test (Derive early to avoid initialization errors)
  const section = test.section;
  const isTask1 = section === 1;
  const isTask2 = section === 2;
  const typeCodes = isTask1 ? WRITING_TASK1_TYPE_CODES : isTask2 ? WRITING_TASK2_TYPE_CODES : {};

  const [saving, setSaving] = useState(false);
  const [contentHtml, setContentHtml] = useState(() => stripRedundantImages(stimulus?.content || '', isTask1));
  const [imageUploading, setImageUploading] = useState(false);

  // Read bài mẫu from instruction (create flow) or explanation.text (edit flow)
  const firstQuestion = firstGroup?.questions[0];
  const rawSample = firstGroup?.instruction || (firstQuestion?.explanation as { text?: string })?.text || '';
  const [sampleHtml, setSampleHtml] = useState<string>(() => parseSample(rawSample));

  // Writing type/topic state
  const [questionTypeCode, setQuestionTypeCode] = useState(firstGroup?.questionTypeCode || '');
  const [topic, setTopic] = useState(firstGroup?.groupContent || '');

  // Chart analysis state (Task 1 only)
  const [chartDataJson, setChartDataJson] = useState('');
  const [chartAnalyzing, setChartAnalyzing] = useState(false);
  const [chartSaving, setChartSaving] = useState(false);
  const [chartJsonError, setChartJsonError] = useState<string | null>(null);
  const [currentMediaUrl, setCurrentMediaUrl] = useState(stimulus?.mediaUrl || '');
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

  const handleUpdateChartImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const url = await uploadMedia(file);
      setCurrentMediaUrl(url);
      toast.success('Đã cập nhật ảnh biểu đồ');
    } catch {
      toast.error('Cập nhật ảnh thất bại');
    } finally {
      setImageUploading(false);
    }
  };

  const handleAnalyzeChart = async () => {
    const file = chartFileRef.current?.files?.[0];
    
    setChartAnalyzing(true);
    try {
      let result;
      if (file) {
        result = await analyzeChartApi(stimulus.id, file);
      } else if (currentMediaUrl) {
        // Fetch from URL and convert to File
        const fileFromUrl = await urlToFile(currentMediaUrl, 'chart.png', 'image/png');
        result = await analyzeChartApi(stimulus.id, fileFromUrl);
      } else {
        toast.error('Vui lòng chọn ảnh biểu đồ hoặc đảm bảo đã có URL ảnh');
        setChartAnalyzing(false);
        return;
      }
      
      setChartDataJson(JSON.stringify(result, null, 2));
      setChartJsonError(null);
      toast.success('Phân tích biểu đồ thành công!');
    } catch (err) {
      console.error('Analysis failed:', err);
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
    content: stripRedundantImages(stimulus?.content || '', isTask1),
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

  const sampleEditor = useEditor({
    extensions: SAMPLE_EDITOR_EXTENSIONS,
    content: sampleHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[250px] focus:outline-none p-4',
      },
    },
    onUpdate: ({ editor: ed }) => {
      setSampleHtml(ed.getHTML());
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
        mediaUrl: currentMediaUrl || undefined,
      });

      const finalSample = sampleEditor?.getHTML() || sampleHtml;
      const sampleText = buildSample(finalSample);
      const hasSample = sampleText.trim().length > 0 && sampleText !== '<p></p>';
      
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
    <div className="space-y-8 w-full">
      {/* Đề bài - Rich Text Editor */}
      <section>
        <label className="text-sm font-bold text-slate-800 mb-3 block flex items-center gap-2">
          1. Đề bài Writing
          <span className="text-[10px] text-slate-400 font-normal normal-case px-2 py-0.5 bg-slate-100 rounded-md">Có thể chèn ảnh biểu đồ</span>
        </label>
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
          <RichTextToolbar editor={editor} onUploadingChange={setImageUploading} />
          <EditorContent editor={editor} />
        </div>
      </section>

      {/* Chart Image (Task 1 only) */}
      {isTask1 && (
        <section className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <ImageIcon className="h-4 w-4 text-slate-500" />
              2. Ảnh biểu đồ (Task 1)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="update-chart-image"
                accept="image/*"
                className="hidden"
                onChange={handleUpdateChartImage}
              />
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-slate-200 h-9 text-xs font-bold px-4"
                onClick={() => document.getElementById('update-chart-image')?.click()}
                disabled={imageUploading}
              >
                {imageUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2 text-blue-600" />}
                Thay đổi ảnh
              </Button>
            </div>
          </div>

          {/* Image Preview */}
          {currentMediaUrl ? (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50/30 group">
              <img src={currentMediaUrl} alt="Chart" className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]" />
            </div>
          ) : (
            <div 
              className="aspect-video w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-all"
              onClick={() => document.getElementById('update-chart-image')?.click()}
            >
              <div className="p-3 bg-white rounded-full shadow-sm">
                <ImageIcon className="h-6 w-6 text-slate-400" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nhấn để tải lên ảnh biểu đồ</span>
            </div>
          )}

          {/* Chart Data Editor is now direct */}
          <div className="pt-8 border-t border-slate-100 space-y-4">
            <ChartDataEditor
              data={chartDataJson}
              onChange={setChartDataJson}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveChartData} 
                disabled={chartSaving} 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-bold shadow-lg shadow-emerald-100 h-10"
              >
                {chartSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Cập nhật
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Bài mẫu - Rich Text Editor */}
      <section>
        <label className="text-sm font-bold text-slate-800 mb-3 block">
          {isTask1 ? '3.' : '2.'} Bài mẫu (Sample Answer)
        </label>
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
          <RichTextToolbar editor={sampleEditor} />
          <EditorContent editor={sampleEditor} />
        </div>
      </section>

    </div>
  );
});
