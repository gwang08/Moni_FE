'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Power, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  listPlacementConfigs,
  createPlacementConfig,
  updatePlacementConfig,
  activatePlacementConfig,
  deletePlacementConfig,
  type PlacementConfigResponse,
  type PlacementConfigRequest,
} from '@/lib/admin-placement-config-api';
import { getTests } from '@/lib/tests-api';

const SKILLS = ['READING', 'LISTENING', 'WRITING', 'SPEAKING'] as const;
const SKILL_LABELS: Record<string, string> = {
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

export default function PlacementConfigPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlacementConfigResponse | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmActivateId, setConfirmActivateId] = useState<number | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formTests, setFormTests] = useState<Record<string, number | ''>>(
    { READING: '', LISTENING: '', WRITING: '', SPEAKING: '' }
  );

  const { data: configs = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'placement-configs'],
    queryFn: listPlacementConfigs,
  });

  // Load published tests for each skill
  const { data: testsBySkill = {} } = useQuery({
    queryKey: ['admin', 'tests-by-skill'],
    queryFn: async () => {
      const result: Record<string, { id: number; title: string; section: number | null }[]> = {};
      for (const skill of SKILLS) {
        const page = await getTests(1, 100, skill);
        result[skill] = page.content
          .filter((t) => t.status === 'PUBLISHED')
          .map((t) => ({ id: t.id, title: t.title, section: t.section }));
      }
      return result;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PlacementConfigRequest) => createPlacementConfig(data),
    onSuccess: () => {
      toast.success('Tạo cấu hình thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'placement-configs'] });
      closeDialog();
    },
    onError: () => toast.error('Tạo cấu hình thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PlacementConfigRequest }) =>
      updatePlacementConfig(id, data),
    onSuccess: () => {
      toast.success('Cập nhật cấu hình thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'placement-configs'] });
      closeDialog();
    },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => activatePlacementConfig(id),
    onSuccess: () => {
      toast.success('Kích hoạt cấu hình thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'placement-configs'] });
      setConfirmActivateId(null);
    },
    onError: () => toast.error('Kích hoạt thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePlacementConfig(id),
    onSuccess: () => {
      toast.success('Đã xóa cấu hình');
      queryClient.invalidateQueries({ queryKey: ['admin', 'placement-configs'] });
      setConfirmDeleteId(null);
    },
    onError: () => toast.error('Xóa thất bại. Không thể xóa cấu hình đang kích hoạt.'),
  });

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormTests({ READING: '', LISTENING: '', WRITING: '', SPEAKING: '' });
    setDialogOpen(true);
  };

  const openEdit = (config: PlacementConfigResponse) => {
    setEditing(config);
    setFormName(config.name);
    setFormTests({
      READING: config.readingTestId,
      LISTENING: config.listeningTestId,
      WRITING: config.writingTestId,
      SPEAKING: config.speakingTestId,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error('Vui lòng nhập tên cấu hình');
      return;
    }
    for (const skill of SKILLS) {
      if (!formTests[skill]) {
        toast.error(`Vui lòng chọn bài thi ${SKILL_LABELS[skill]}`);
        return;
      }
    }

    const data: PlacementConfigRequest = {
      name: formName.trim(),
      readingTestId: formTests.READING as number,
      listeningTestId: formTests.LISTENING as number,
      writingTestId: formTests.WRITING as number,
      speakingTestId: formTests.SPEAKING as number,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">
            Quản lý cấu hình bài kiểm tra trình độ đầu vào (4 kỹ năng)
          </p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tạo cấu hình
          </Button>
        </div>

        {error && (
          <p className="text-red-500 mb-4 text-sm">Không thể tải danh sách cấu hình</p>
        )}

        {isLoading ? (
          <SkeletonTable rows={3} cols={6} />
        ) : configs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Chưa có cấu hình nào. Bấm &quot;Tạo cấu hình&quot; để bắt đầu.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tên</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Reading</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Listening</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Writing</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Speaking</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {configs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{config.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[140px]">
                      {config.readingTestTitle}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[140px]">
                      {config.listeningTestTitle}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[140px]">
                      {config.writingTestTitle}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[140px]">
                      {config.speakingTestTitle}
                    </td>
                    <td className="px-4 py-3">
                      {config.isActive ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <Check className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!config.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmActivateId(config.id)}
                            title="Kích hoạt"
                          >
                            <Power className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(config)}
                          title="Sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!config.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(config.id)}
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
              <h2 className="text-lg font-bold">
                {editing ? 'Cập nhật cấu hình' : 'Tạo cấu hình mới'}
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên cấu hình
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Placement Q2 2026"
                />
              </div>

              {SKILLS.map((skill) => (
                <div key={skill}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bài thi {SKILL_LABELS[skill]}
                  </label>
                  <select
                    className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formTests[skill]}
                    onChange={(e) =>
                      setFormTests((prev) => ({
                        ...prev,
                        [skill]: e.target.value ? Number(e.target.value) : '',
                      }))
                    }
                  >
                    <option value="">-- Chọn bài thi --</option>
                    {(testsBySkill[skill] || []).map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.title}
                        {test.section != null ? ` (Section ${test.section})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeDialog} disabled={isPending}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={isPending}>
                  {isPending ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Activate */}
        <ConfirmDialog
          open={confirmActivateId !== null}
          onOpenChange={() => setConfirmActivateId(null)}
          title="Kích hoạt cấu hình này?"
          description="Cấu hình hiện tại (nếu có) sẽ bị vô hiệu hóa. Tất cả người học mới sẽ dùng cấu hình này cho bài placement test."
          onConfirm={() => { if (confirmActivateId) activateMutation.mutate(confirmActivateId); }}
          confirmText="Kích hoạt"
        />

        {/* Confirm Delete */}
        <ConfirmDialog
          open={confirmDeleteId !== null}
          onOpenChange={() => setConfirmDeleteId(null)}
          title="Xóa cấu hình này?"
          description="Hành động này không thể hoàn tác."
          onConfirm={() => { if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId); }}
          confirmText="Xóa"
          variant="destructive"
        />
      </div>
    </div>
  );
}
