'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Trash2, Plus } from 'lucide-react';
import { useTestEditMutations } from '@/components/admin/use-test-edit-mutations';
import { updateQuestion, createQuestion } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { TestDetailResponse } from '@/types/test.types';

interface Props {
  test: TestDetailResponse;
}

export function TestEditSpeakingContent({ test }: Props) {
  const queryClient = useQueryClient();
  const testId = String(test.id);
  const { handleDeleteQuestion } = useTestEditMutations(testId);
  const stimulus = test.stimuli[0];
  const questions = stimulus?.questionGroups[0]?.questions || [];
  const [saving, setSaving] = useState(false);

  // Local edits tracked by question id
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newSample, setNewSample] = useState('');

  const [edits, setEdits] = useState<Record<number, { content: string; sample: string }>>(() => {
    const map: Record<number, { content: string; sample: string }> = {};
    for (const q of questions) {
      map[q.id] = { content: q.content, sample: q.explanation?.text || '' };
    }
    return map;
  });

  if (!stimulus) return <p className="text-gray-400 text-center py-8">Chưa có nội dung</p>;

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(edits).map(([idStr, edit]) => {
        const id = Number(idStr);
        return updateQuestion(String(id), {
          content: edit.content,
          explanation: edit.sample ? { text: edit.sample } : undefined,
        });
      });
      await Promise.all(promises);
      toast.success('Đã lưu tất cả câu hỏi Speaking');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const updateEdit = (id: number, patch: Partial<{ content: string; sample: string }>) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {stimulus.content && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Chủ đề</label>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{stimulus.content}</p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Danh sách câu hỏi ({questions.length})
        </label>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const edit = edits[q.id] || { content: q.content, sample: '' };
            return (
              <div key={q.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded shrink-0">
                    Câu {i + 1}
                  </span>
                  <Input
                    value={edit.content}
                    onChange={(e) => updateEdit(q.id, { content: e.target.value })}
                    className="flex-1 h-8 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-gray-300 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  value={edit.sample}
                  onChange={(e) => updateEdit(q.id, { sample: e.target.value })}
                  placeholder="Gợi ý / bài mẫu (tuỳ chọn)..."
                  rows={2}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Add question */}
      {addingQuestion ? (
        <div className="border border-dashed border-blue-300 rounded-lg p-3 space-y-2">
          <Input
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Nội dung câu hỏi..."
            className="h-8 text-sm"
          />
          <textarea
            value={newSample}
            onChange={(e) => setNewSample(e.target.value)}
            placeholder="Gợi ý / bài mẫu (tuỳ chọn)..."
            rows={2}
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" disabled={!newContent.trim() || saving} onClick={async () => {
              setSaving(true);
              try {
                const groupId = stimulus.questionGroups[0]?.id;
                if (!groupId) return;
                await createQuestion(groupId, {
                  content: newContent.trim(),
                  position: questions.length + 1,
                  explanation: newSample ? { text: newSample } : undefined,
                  options: [{ label: 'A', content: 'SPEAKING_ANSWER', isCorrect: true }],
                });
                toast.success('Đã thêm câu hỏi');
                queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
                setNewContent('');
                setNewSample('');
                setAddingQuestion(false);
              } catch { toast.error('Thêm thất bại'); }
              finally { setSaving(false); }
            }}>Thêm</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setAddingQuestion(false); setNewContent(''); setNewSample(''); }}>Hủy</Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAddingQuestion(true)}
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors">
          <Plus className="h-3 w-3" /> Thêm câu hỏi
        </button>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={saving} size="sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Lưu tất cả
        </Button>
      </div>
    </div>
  );
}
