'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { updateStimulus, updateQuestion } from '@/lib/admin-api';
import type { TestDetailResponse } from '@/types/test.types';

interface Props {
  test: TestDetailResponse;
}

export function TestEditWritingContent({ test }: Props) {
  const queryClient = useQueryClient();
  const testId = String(test.id);
  const stimulus = test.stimuli[0];
  const [saving, setSaving] = useState(false);

  const [prompt, setPrompt] = useState(stimulus?.content || '');
  const [imageUrl, setImageUrl] = useState(stimulus?.mediaUrl || '');
  const [sampleAnswer, setSampleAnswer] = useState(
    stimulus?.questionGroups[0]?.instruction || ''
  );

  if (!stimulus) return <p className="text-gray-400 text-center py-8">Chưa có nội dung</p>;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update stimulus content and mediaUrl
      await updateStimulus(stimulus.id, {
        content: prompt,
        mediaUrl: imageUrl || undefined,
      });

      // Update sample answer via question explanation if a question exists
      const firstQuestion = stimulus.questionGroups[0]?.questions[0];
      if (firstQuestion && sampleAnswer) {
        await updateQuestion(String(firstQuestion.id), {
          explanation: { text: sampleAnswer },
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
    <div className="space-y-5 max-w-2xl">
      {/* Prompt editor */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Đề bài Writing</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Chart/Image */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Biểu đồ / Hình ảnh (Task 1)
        </label>
        {imageUrl ? (
          <div className="relative inline-block">
            <img src={imageUrl} alt="Chart" className="max-h-48 rounded-lg border border-gray-200" />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <MediaUploadZone onUploaded={(url) => setImageUrl(url)} />
        )}
      </div>

      {/* Sample Answer */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Bài mẫu</label>
        <textarea
          value={sampleAnswer}
          onChange={(e) => setSampleAnswer(e.target.value)}
          rows={6}
          placeholder="Nhập bài mẫu tham khảo..."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
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
