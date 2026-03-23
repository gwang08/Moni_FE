'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { autoGenerateFullTest } from '@/lib/admin-full-test-api';

const SKILLS = ['READING', 'LISTENING', 'SPEAKING'] as const;
type Skill = (typeof SKILLS)[number];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FullTestAutoDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [title, setTitle] = useState('');

  const mutation = useMutation({
    mutationFn: autoGenerateFullTest,
    onSuccess: () => {
      toast.success('Tạo Full Test ngẫu nhiên thành công!');
      queryClient.invalidateQueries({ queryKey: ['full-tests'] });
      handleClose();
    },
    onError: (err: Error) => toast.error(err.message || 'Tạo thất bại'),
  });

  const handleClose = () => {
    setSkill(null);
    setTitle('');
    onClose();
  };

  const handleSubmit = () => {
    if (!skill) return;
    mutation.mutate({ skill, title: title.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Tạo Full Test ngẫu nhiên</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Kỹ năng *</Label>
            <div className="flex gap-2">
              {SKILLS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSkill(s)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    skill === s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tên đề (tùy chọn)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Để trống = tự động đặt tên" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Hủy</Button>
          <Button disabled={!skill || mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending ? 'Đang tạo...' : 'Tạo ngẫu nhiên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
