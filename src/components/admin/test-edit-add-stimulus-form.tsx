'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, X } from 'lucide-react';
import { createStimulus, addStimulusToTest } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';

interface Props {
  testId: string;
  skill: string;
  sectionNumber?: number;
  onClose: () => void;
}

export interface TestEditAddStimulusFormHandle {
  submit: () => Promise<boolean>;
}

export const TestEditAddStimulusForm = forwardRef<TestEditAddStimulusFormHandle, Props>(
  function TestEditAddStimulusForm(
    { testId, skill, sectionNumber = 1, onClose }: Props,
    ref
  ) {
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);

    const handleSubmit = async () => {
      if (!title.trim()) {
        toast.error('Vui lòng nhập tiêu đề phần thi');
        return false;
      }

      setSaving(true);
      try {
        // Create the new stimulus
        const newStimulusId = await createStimulus({
          title: title.trim(),
          content: content.trim(),
          mediaUrl,
          section: sectionNumber,
          questionGroups: [],
        });

        // Add it to the current test
        await addStimulusToTest(testId, { stimulusId: newStimulusId });

        toast.success('Đã thêm phần thi mới');
        queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
        onClose();
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Thêm phần thi thất bại');
        return false;
      } finally {
        setSaving(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }));

    return (
      <div className="border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50/30 space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-green-700">Thêm phần thi mới</h5>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="mb-1 block text-xs text-gray-600">Tiêu đề *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Part 1 - Conversation, Section 1, Task 1..."
              className="text-xs h-7"
            />
          </div>

          <div>
            <Label className="mb-1 block text-xs text-gray-600">Nội dung (HTML)</Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nội dung đề bài (có thể để trống)"
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm resize-y"
            />
          </div>

          {skill === 'LISTENING' && (
            <div>
              <Label className="mb-1 block text-xs text-gray-600">Audio URL (cho kỹ năng nghe)</Label>
              {mediaUrl ? (
                <div className="space-y-1">
                  <audio controls src={mediaUrl} className="h-8 w-full" />
                  <button type="button" onClick={() => setMediaUrl(undefined)} className="text-xs text-red-500 hover:text-red-700">
                    Xóa audio
                  </button>
                </div>
              ) : (
                <MediaUploadZone onUploaded={(url) => setMediaUrl(url)} />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onClose}>
              Hủy
            </Button>
            <Button type="button" size="sm" className="h-7 text-xs" onClick={() => void handleSubmit()} disabled={saving}>
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Tạo phần thi
            </Button>
          </div>
        </div>
      </div>
    );
  }
);
