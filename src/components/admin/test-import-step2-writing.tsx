'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StimulusCard } from '@/components/admin/test-import-stimulus-card';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { Image as ImageIcon, Link as LinkIcon, Trash2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  WRITING_TASK1_TYPE_CODES,
  WRITING_TASK2_TYPE_CODES,
  WRITING_TYPE_CODE_LABELS,
} from '@/components/practice/writing-filter-constants';
import { getTags } from '@/lib/admin-api';
import type { TagResponse, StimulusRequest, QuestionTypeCode, QuestionGroupRequest } from '@/types/admin.types';

interface Props {
  stimuli: StimulusRequest[];
  onChange: (stimuli: StimulusRequest[]) => void;
  onNext: () => void;
  onBack: () => void;
  /** Section number: 1 = Task 1, 2 = Task 2 */
  section?: number | null;
}

const emptyStimulus = (): StimulusRequest => ({
  title: '',
  content: '',
  mediaUrl: undefined,
  section: 1,
  questionGroups: [],
  tagIds: [],
});

export function TestImportStep2Writing({ stimuli, onChange, onNext, onBack, section }: Props) {
  const [writingTypeTags, setWritingTypeTags] = useState<TagResponse[]>([]);
  const [topicTags, setTopicTags] = useState<TagResponse[]>([]);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Fetch tags by type from API once on mount
  useEffect(() => {
    getTags().then((all) => {
      // Corrected filter to include both WRITING_TYPE and QUESTION_TYPE as per DB structure
      setWritingTypeTags(all.filter((t) => t.type === 'WRITING_TYPE' || t.type === 'QUESTION_TYPE'));
      setTopicTags(all.filter((t) => t.type === 'TOPIC'));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (stimuli.length === 0) onChange([emptyStimulus()]);
  }, [stimuli.length, onChange]);

  if (stimuli.length === 0) return null;

  const stimulus = stimuli[0];
  const update = (patch: Partial<StimulusRequest>) => onChange([{ ...stimulus, ...patch }]);
  
  // Determine writing type options based on section
  const isTask1 = section === 1 || section === 3;
  const isTask2 = section === 2;
  const typeCodes = isTask1 ? WRITING_TASK1_TYPE_CODES : isTask2 ? WRITING_TASK2_TYPE_CODES : {};

  const currentTagIds = stimulus.tagIds || [];
  const currentTypeCode = stimulus.questionGroups[0]?.questionTypeCode || '';

  // Derive currently selected writing type tag ID from questionTypeCode
  const validWritingTypeTags = writingTypeTags.filter((t) => 
    Object.keys(typeCodes).some(label => {
      const normalizedLabel = label.replace(/^Task [12]:\s*/i, '').toLowerCase();
      const normalizedTagName = t.name.toLowerCase();
      return normalizedTagName === normalizedLabel || 
             (normalizedLabel === 'mixed graph' && (normalizedTagName === 'multiple charts' || normalizedTagName === 'mixed chart' || normalizedTagName === 'mixed graph')) ||
             (normalizedTagName === 'mixed graph' && (normalizedLabel === 'mixed chart' || normalizedLabel === 'multiple charts'));
    })
  );

  const selectedWritingTypeTag = validWritingTypeTags.find((t) => {
    // Match by looking up label from code
    const label = Object.keys(typeCodes).find((l) => typeCodes[l] === currentTypeCode);
    if (!label) return false;
    
    const normalizedLabel = label.replace(/^Task [12]:\s*/i, '').toLowerCase();
    const normalizedTagName = t.name.toLowerCase();
    return normalizedTagName === normalizedLabel || 
           (normalizedLabel === 'mixed graph' && (normalizedTagName === 'multiple charts' || normalizedTagName === 'mixed chart' || normalizedTagName === 'mixed graph')) ||
           (normalizedTagName === 'mixed graph' && (normalizedLabel === 'mixed chart' || normalizedLabel === 'multiple charts'));
  });

  const isValid = stimulus.content.trim().length > 0 && (selectedWritingTypeTag !== undefined);

  // Derive currently selected topic tag (first topic in tagIds)
  const selectedTopicTag = topicTags.find((t) => currentTagIds.includes(t.id));

  /** Helper: update fields on the first questionGroup, creating it if needed */
  const updateGroup = (patch: Partial<QuestionGroupRequest>) => {
    const existing: QuestionGroupRequest = stimulus.questionGroups[0] || { questionTypeCode: 'SHORT_ANSWER', instruction: '', questions: [] };
    update({ questionGroups: [{ ...existing, ...patch }] });
  };

  const updateWritingType = (tagId: number) => {
    const tag = validWritingTypeTags.find((t) => t.id === tagId);
    
    // Replace old writing type tag, keep others
    const writingTypeIds = validWritingTypeTags.map((t) => t.id);
    const otherTags = currentTagIds.filter((id) => !writingTypeIds.includes(id));
    const existing = stimulus.questionGroups[0] || { questionTypeCode: 'SHORT_ANSWER', instruction: '', questions: [] };

    if (!tag) {
      // Cleared
      onChange([{
        ...stimulus,
        questionGroups: [{ ...existing, questionTypeCode: '' as QuestionTypeCode }],
        tagIds: otherTags
      }]);
      return;
    }

    // Find the matching code from typeCodes using the same logic as filtering
    const matchingLabel = Object.keys(typeCodes).find(label => {
      const normalizedLabel = label.replace(/^Task [12]:\s*/i, '').toLowerCase();
      const normalizedTagName = tag.name.toLowerCase();
      
      // Strict matching to avoid "Map Labeling" matching "Map"
      return normalizedTagName === normalizedLabel || 
             (normalizedLabel === 'mixed graph' && (normalizedTagName === 'multiple charts' || normalizedTagName === 'mixed chart' || normalizedTagName === 'mixed graph')) ||
             (normalizedTagName === 'mixed graph' && (normalizedLabel === 'mixed chart' || normalizedLabel === 'multiple charts'));
    });

    const code = (matchingLabel ? typeCodes[matchingLabel] : Object.values(typeCodes)[0] || '') as QuestionTypeCode;

    onChange([{
      ...stimulus,
      questionGroups: [{ ...existing, questionTypeCode: code }],
      tagIds: [...otherTags, tag.id]
    }]);
  };

  const updateTopic = (tagId: number) => {
    // Replace old topic tag, keep others (e.g. writing type tag)
    const topicIds = topicTags.map((t) => t.id);
    const otherTags = currentTagIds.filter((id) => !topicIds.includes(id));

    if (!tagId) {
      update({ tagIds: otherTags });
      return;
    }
    update({ tagIds: [...otherTags, tagId] });
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      update({ mediaUrl: urlInput.trim() });
      setIsUrlDialogOpen(false);
      setUrlInput('');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Settings Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dạng đề */}
        {(isTask1 || isTask2) && (
          <div className={isTask1 && !isTask2 ? "md:col-span-2" : ""}>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Dạng đề
              <span className="text-xs text-gray-400 font-normal ml-2">Task {section}</span>
            </label>
            <select
              value={selectedWritingTypeTag?.id ?? ''}
              onChange={(e) => updateWritingType(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn dạng đề --</option>
              {validWritingTypeTags.map((tag) => {
                // Find matching label from WRITING_TYPE_CODE_LABELS
                const matchingLabelKey = Object.keys(typeCodes).find(label => {
                  const normalizedLabel = label.replace(/^Task [12]:\s*/i, '').toLowerCase();
                  const normalizedTagName = tag.name.toLowerCase();
                  return normalizedTagName === normalizedLabel || 
                         (normalizedLabel === 'mixed graph' && (normalizedTagName === 'multiple charts' || normalizedTagName === 'mixed chart' || normalizedTagName === 'mixed graph')) ||
                         (normalizedTagName === 'mixed graph' && (normalizedLabel === 'mixed chart' || normalizedLabel === 'multiple charts'));
                });
                const code = matchingLabelKey ? typeCodes[matchingLabelKey] : null;
                const displayName = code ? WRITING_TYPE_CODE_LABELS[code] : tag.name;

                return (
                  <option key={tag.id} value={tag.id}>{displayName}</option>
                );
              })}
            </select>
          </div>
        )}

        {/* Chủ đề */}
        {isTask2 && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Chủ đề</label>
            <select
              value={selectedTopicTag?.id ?? ''}
              onChange={(e) => updateTopic(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn chủ đề --</option>
              {topicTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Đề bài - Higher height */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-2 block font-black uppercase tracking-tight">
          1. Đề bài Writing
          <span className="text-xs text-gray-400 font-normal ml-2 normal-case">Có thể chèn ảnh biểu đồ trực tiếp vào đề</span>
        </label>
        <div className="h-[400px]">
          <StimulusCard
            stimulus={stimulus}
            onChange={(updated) => onChange([updated])}
          />
        </div>
      </div>

      {/* Ảnh biểu đồ (Task 1 only) - Moved below prompt */}
      {isTask1 && (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-slate-500" />
            2. Ảnh biểu đồ (Task 1)
          </label>

          {stimulus.mediaUrl ? (
            <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
              <img src={stimulus.mediaUrl} alt="Chart" className="max-h-[300px] w-full object-contain bg-slate-50" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="rounded-full h-10 w-10 p-0" 
                  onClick={() => update({ mediaUrl: '' })}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
              <div className="absolute bottom-0 inset-x-0 p-2 bg-white/90 backdrop-blur border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium truncate px-2">{stimulus.mediaUrl}</span>
                <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-100">READY</Badge>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <MediaUploadZone 
                onUploaded={(url) => update({ mediaUrl: url })}
                icon={<ImageIcon className="h-8 w-8 text-blue-500 mb-2" />}
                label={
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-blue-600 font-medium text-base">Thêm ảnh</span>
                    <span className="text-gray-400 text-sm font-normal">hoặc</span>
                    <button 
                      type="button"
                      className="text-blue-600 font-medium text-base hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUrlDialogOpen(true);
                      }}
                    >
                      Thêm từ URL
                    </button>
                  </div>
                }
                sublabel={null}
                className="min-h-[200px] !p-8 border-blue-200 bg-blue-50/10 hover:bg-blue-50/30"
                hideIcon={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Bài mẫu - Single Rich Text Editor */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-2 block font-black uppercase tracking-tight">
          {isTask1 ? '3.' : '2.'} Bài mẫu (Sample Answer)
          <span className="text-xs text-gray-400 font-normal ml-2 normal-case">Nhập toàn bộ bài mẫu, hệ thống sẽ tự tách đoạn cho người học</span>
        </label>
        <div className="h-[400px]">
          <StimulusCard
            stimulus={{
              ...emptyStimulus(),
              content: stimulus.questionGroups[0]?.instruction || '',
            }}
            onChange={(updated) => updateGroup({ instruction: updated.content })}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid} size="lg" className="px-10">Tiếp theo</Button>
      </div>

      {/* URL Input Dialog */}
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm từ URL</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Nhập đường dẫn URL hình ảnh, YouTube</label>
              <Input 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://"
                className="h-11 rounded-lg border-gray-200"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUrlSubmit();
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="bg-slate-100 hover:bg-slate-200 text-gray-600 px-6" onClick={() => setIsUrlDialogOpen(false)}>
              Hủy
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8" onClick={handleUrlSubmit}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
