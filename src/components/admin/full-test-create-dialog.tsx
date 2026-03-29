'use client';

import { useMemo, useState } from 'react';
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

const SECTION_COUNT: Record<Skill, number> = {
  READING: 3,
  LISTENING: 4,
  SPEAKING: 3,
};

const SKILL_LABELS: Record<Skill, string> = {
  READING: 'Reading',
  LISTENING: 'Listening',
  SPEAKING: 'Speaking',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FullTestCreateDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');

  const sectionCount = skill ? SECTION_COUNT[skill] : 0;
  const selectedCount = Object.keys(selected).length;
  const allSectionsSelected = sectionCount > 0 && selectedCount === sectionCount;
  const sectionLabel = skill === 'SPEAKING' ? 'Part' : 'Section';

  const { data: stimuliMap, isLoading } = useQuery({
    queryKey: ['full-test-stimuli', skill],
    queryFn: () => getAvailableStimuli(skill!),
    enabled: !!skill && step === 2,
    staleTime: 30_000,
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

  const selectedSummary = useMemo(() => {
    if (!stimuliMap || !skill) return [] as Array<{ section: number; title: string }>;

    return Array.from({ length: sectionCount }, (_, i) => i + 1)
      .map((sec) => {
        const options: StimulusOption[] = stimuliMap[sec] ?? [];
        const chosenId = selected[sec];
        const chosen = options.find((opt) => opt.stimulusId === chosenId);
        return chosen ? { section: sec, title: chosen.title } : null;
      })
      .filter((item): item is { section: number; title: string } => item !== null);
  }, [stimuliMap, selected, sectionCount, skill]);

  const handleClose = () => {
    setStep(1);
    setSkill(null);
    setSelected({});
    setTitle('');
    setDuration('');
    onClose();
  };

  const handleSubmit = () => {
    if (!skill || !title.trim() || !allSectionsSelected) return;
    const stimulusIds = Array.from({ length: sectionCount }, (_, i) => selected[i + 1]).filter(
      (id): id is number => typeof id === 'number'
    );

    mutation.mutate({
      title: title.trim(),
      skill,
      duration: duration ? parseInt(duration, 10) : undefined,
      stimulusIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Full Test - Bước {step}/2</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Kỹ năng *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SKILLS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSkill(s);
                      setSelected({});
                    }}
                    className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                      skill === s
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {SKILL_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tên Full Test *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tên đề thi..."
              />
            </div>

            <div className="space-y-2">
              <Label>Thời gian (phút, tùy chọn)</Label>
              <Input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ví dụ: 60"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Hủy</Button>
              <Button disabled={!skill || !title.trim()} onClick={() => setStep(2)}>
                Tiếp theo
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && skill && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-600">
                Chọn stimulus cho từng {sectionLabel.toLowerCase()} - {SKILL_LABELS[skill]}
              </p>
              <p className="text-gray-500">
                Đã chọn {selectedCount}/{sectionCount} {sectionLabel.toLowerCase()}
              </p>
            </div>

            {isLoading ? (
              <p className="text-sm text-gray-500">Đang tải danh sách stimulus...</p>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${sectionCount}, minmax(0, 1fr))` }}>
                {Array.from({ length: sectionCount }, (_, i) => i + 1).map((sec) => {
                  const options: StimulusOption[] = stimuliMap?.[sec] ?? [];

                  return (
                    <div key={sec} className="border rounded-lg p-3 space-y-2">
                      <p className="font-semibold text-sm text-gray-700">{sectionLabel} {sec}</p>

                      {options.length === 0 ? (
                        <p className="text-xs text-amber-600">
                          Chưa có stimulus cho {sectionLabel} {sec}. Vui lòng tạo thêm bài lẻ.
                        </p>
                      ) : (
                        options.map((opt) => (
                          <label key={opt.stimulusId} className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`${sectionLabel}-${sec}`}
                              checked={selected[sec] === opt.stimulusId}
                              onChange={() => setSelected((prev) => ({ ...prev, [sec]: opt.stimulusId }))}
                              className="mt-0.5"
                            />
                            <span className="text-xs leading-5 text-gray-700">
                              {opt.title}
                              {skill === 'READING' && (
                                <span className="ml-1 text-gray-500">({opt.questionCount} câu)</span>
                              )}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-lg border bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Danh sách đã chọn</p>
              {selectedSummary.length === 0 ? (
                <p className="text-xs text-gray-500">Chưa chọn stimulus nào.</p>
              ) : (
                <div className="space-y-1">
                  {selectedSummary.map((item) => (
                    <p key={item.section} className="text-xs text-gray-700">
                      {sectionLabel} {item.section}: {item.title}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Quay lại</Button>
              <Button disabled={!allSectionsSelected || mutation.isPending} onClick={handleSubmit}>
                {mutation.isPending ? 'Đang tạo...' : 'Tạo Full Test'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
