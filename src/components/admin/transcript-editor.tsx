'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Save, Trash2, Plus, Clock, Type } from 'lucide-react';
import { transcribeStimulus, updateStimulus } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

interface Props {
  stimulusId: number;
  testId: string;
  mediaUrl: string | null;
  initialTranscript?: TranscriptSegment[];
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function TranscriptEditor({ stimulusId, testId, mediaUrl, initialTranscript }: Props) {
  const queryClient = useQueryClient();
  const [transcript, setTranscript] = useState<TranscriptSegment[]>(initialTranscript ?? []);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'transcript' | 'subtitle'>('transcript');

  const handleGenerate = async () => {
    if (!mediaUrl) {
      toast.error('Chưa có file audio');
      return;
    }
    setGenerating(true);
    try {
      const result = await transcribeStimulus(stimulusId);
      setTranscript(result);
      toast.success('Tạo transcript thành công! Kiểm tra và chỉnh sửa trước khi lưu.');
    } catch {
      toast.error('Tạo transcript thất bại. Kiểm tra API key hoặc thử lại.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStimulus(stimulusId, { transcript });
      toast.success('Đã lưu transcript');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
    } catch {
      toast.error('Lưu transcript thất bại');
    } finally {
      setSaving(false);
    }
  };

  const updateSegment = (idx: number, field: keyof TranscriptSegment, value: string | number) => {
    setTranscript(prev => prev.map((seg, i) =>
      i === idx ? { ...seg, [field]: value } : seg
    ));
  };

  const removeSegment = (idx: number) => {
    setTranscript(prev => prev.filter((_, i) => i !== idx));
  };

  const addSegment = () => {
    const lastEnd = transcript.length > 0 ? transcript[transcript.length - 1].endTime : 0;
    setTranscript(prev => [...prev, {
      id: `seg_${Date.now()}`,
      startTime: lastEnd,
      endTime: lastEnd + 5,
      text: '',
      speaker: 'Speaker A',
    }]);
    setEditingIdx(transcript.length);
  };

  // Full transcript text for easy evidence selection
  const fullTranscriptText = transcript
    .map(seg => {
      const speaker = seg.speaker ? `${seg.speaker}: ` : '';
      return `${speaker}${seg.text}`;
    })
    .join('\n\n');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Transcript</h4>
        <div className="flex gap-2">
          {transcript.length > 0 && (
            <>
              {/* View mode toggle */}
              <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-md">
                <button type="button" onClick={() => setViewMode('transcript')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors flex items-center gap-1 ${viewMode === 'transcript' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Type className="h-3 w-3" /> Transcript
                </button>
                <button type="button" onClick={() => setViewMode('subtitle')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors flex items-center gap-1 ${viewMode === 'subtitle' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Clock className="h-3 w-3" /> Subtitle
                </button>
              </div>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1"
                disabled={saving} onClick={handleSave}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Lưu
              </Button>
            </>
          )}
          <Button type="button" size="sm" className="h-7 text-xs gap-1"
            disabled={generating || !mediaUrl} onClick={handleGenerate}>
            {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {generating ? 'Đang tạo...' : transcript.length > 0 ? 'Tạo lại' : 'Tạo transcript (AI)'}
          </Button>
        </div>
      </div>

      {generating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-blue-700 font-medium">Đang phân tích audio với AssemblyAI...</p>
          <p className="text-xs text-blue-500 mt-1">Quá trình này có thể mất 1-3 phút</p>
        </div>
      )}

      {!generating && transcript.length === 0 && (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500">Chưa có transcript</p>
          <p className="text-xs text-gray-400 mt-1">
            {mediaUrl ? 'Bấm "Tạo transcript (AI)" để tự động tạo từ audio' : 'Upload audio trước khi tạo transcript'}
          </p>
        </div>
      )}

      {/* Transcript view: plain text for easy evidence scanning */}
      {!generating && transcript.length > 0 && viewMode === 'transcript' && (
        <div className="border rounded-lg bg-white max-h-[400px] overflow-y-auto">
          <div className="px-4 py-3 text-sm leading-relaxed text-gray-800 whitespace-pre-line select-text cursor-text">
            {fullTranscriptText}
          </div>
          <div className="border-t px-3 py-1.5 bg-gray-50">
            <p className="text-[10px] text-gray-400">Quét chọn text để lấy dẫn chứng. Chuyển sang &quot;Subtitle&quot; để sửa timestamp.</p>
          </div>
        </div>
      )}

      {/* Subtitle view: with timestamps and editing */}
      {!generating && transcript.length > 0 && viewMode === 'subtitle' && (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto border rounded-lg p-2">
          {transcript.map((seg, idx) => (
            <div key={seg.id} className="flex gap-2 items-start p-2 rounded-md hover:bg-gray-50 group text-sm">
              {/* Timestamp */}
              <span className="text-[10px] font-mono text-gray-400 pt-1 shrink-0 w-[45px]">
                {formatTime(seg.startTime)}
              </span>

              {/* Speaker */}
              {editingIdx === idx ? (
                <Input
                  value={seg.speaker ?? ''}
                  onChange={(e) => updateSegment(idx, 'speaker', e.target.value)}
                  className="w-24 h-6 text-xs shrink-0"
                  placeholder="Speaker"
                />
              ) : (
                <button type="button" onClick={() => setEditingIdx(idx)}
                  className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full shrink-0 hover:bg-blue-100">
                  {seg.speaker || '?'}
                </button>
              )}

              {/* Text */}
              {editingIdx === idx ? (
                <textarea
                  value={seg.text}
                  onChange={(e) => updateSegment(idx, 'text', e.target.value)}
                  className="flex-1 text-xs border rounded px-2 py-1 resize-none"
                  rows={2}
                  onBlur={() => setEditingIdx(null)}
                  autoFocus
                />
              ) : (
                <p className="flex-1 text-gray-700 cursor-pointer hover:text-gray-900"
                  onClick={() => setEditingIdx(idx)}>
                  {seg.text}
                </p>
              )}

              {/* Delete */}
              <button type="button" onClick={() => removeSegment(idx)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 pt-1 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <button type="button" onClick={addSegment}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 p-2">
            <Plus className="h-3 w-3" /> Thêm đoạn
          </button>
        </div>
      )}
    </div>
  );
}
