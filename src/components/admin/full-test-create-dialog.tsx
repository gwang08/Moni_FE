'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getAvailableStimuli, createFullTest } from '@/lib/admin-full-test-api';
import type { StimulusOption } from '@/lib/admin-full-test-api';

const SKILLS = ['READING', 'LISTENING', 'SPEAKING'] as const;
type Skill = (typeof SKILLS)[number];

// Number of sections per skill
const SECTION_COUNT: Record<Skill, number> = { READING: 3, LISTENING: 4, SPEAKING: 3 };

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FullTestCreateDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [skill, setSkill] = useState<Skill | null>(null);
  // section (1-based) → stimulusId
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');

  const { data: stimuliMap, isLoading } = useQuery({
    queryKey: ['full-test-stimuli', skill],
    queryFn: () => getAvailableStimuli(skill!),
    enabled: !!skill && step === 2,
  });

  const mutation = useMutation({
    mutationFn: createFullTest,
    onSuccess: () => {
      toast.success('Tạo Full Test thành công!');
      queryClient.invalidateQueries({ queryKey: ['full-tests'] });
      handleClose();
    },
    onError: (err: Error) => toast.error(err.message || 'Tạo thất bại'),
  });

  const handleClose = () => {
    setStep(1);
    setSkill(null);
    setSelected({});
    setTitle('');
    setDuration('');
    onClose();
  };

  const handleSubmit = () => {
    if (!skill || !title.trim()) return;
    const stimulusIds = Object.values(selected);
    mutation.mutate({
      title: title.trim(),
      skill,
      duration: duration ? parseInt(duration, 10) : undefined,
      stimulusIds,
    });
  };

  const sectionCount = skill ? SECTION_COUNT[skill] : 0;
  const allSectionsSelected = sectionCount > 0 && Object.keys(selected).length === sectionCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Full Test — Bước {step}/3</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">Chọn kỹ năng cho Full Test:</p>
            <div className="flex gap-3">
              {SKILLS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSkill(s)}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium text-sm transition-colors ${
                    skill === s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Hủy</Button>
              <Button disabled={!skill} onClick={() => setStep(2)}>Tiếp theo</Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && skill && (
          <div className="space-y-4 py-2">
            {isLoading ? (
              <p className="text-sm text-gray-500">Đang tải...</p>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${sectionCount}, 1fr)` }}>
                {Array.from({ length: sectionCount }, (_, i) => i + 1).map((sec) => {
                  const options: StimulusOption[] = stimuliMap?.[sec] ?? [];
                  return (
                    <div key={sec} className="border rounded-lg p-3 space-y-2">
                      <p className="font-semibold text-sm text-gray-700">Section {sec}</p>
                      {options.length === 0 ? (
                        <p className="text-xs text-amber-600">Chưa có bài lẻ cho Section {sec}. Vui lòng tạo thêm.</p>
                      ) : (
                        options.map((opt) => (
                          <label key={opt.stimulusId} className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`section-${sec}`}
                              checked={selected[sec] === opt.stimulusId}
                              onChange={() => setSelected((prev) => ({ ...prev, [sec]: opt.stimulusId }))}
                              className="mt-0.5"
                            />
                            <span className="text-xs">
                              {opt.title}
                              <span className="text-gray-400 ml-1">({opt.questionCount} câu)</span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Quay lại</Button>
              <Button disabled={!allSectionsSelected} onClick={() => setStep(3)}>Tiếp theo</Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tên Full Test *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên đề thi..." />
            </div>
            <div className="space-y-2">
              <Label>Thời gian (phút, tùy chọn)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ví dụ: 60"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(2)}>Quay lại</Button>
              <Button disabled={!title.trim() || mutation.isPending} onClick={handleSubmit}>
                {mutation.isPending ? 'Đang tạo...' : 'Tạo Full Test'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
