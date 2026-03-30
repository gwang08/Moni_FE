'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminHeader } from '@/components/admin/admin-header';
import { getAvailableStimuli, getFullTestById, updateFullTest } from '@/lib/admin-full-test-api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const SKILL_BADGE: Record<string, string> = {
  READING: 'bg-blue-100 text-blue-800 border-blue-200',
  LISTENING: 'bg-purple-100 text-purple-800 border-purple-200',
  SPEAKING: 'bg-orange-100 text-orange-800 border-orange-200',
  WRITING: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const TEST_TYPE_BADGE: Record<string, string> = {
  ACADEMIC: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  GENERAL_TRAINING: 'bg-teal-100 text-teal-800 border-teal-200',
  BOTH: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  FULL_TEST: 'bg-violet-100 text-violet-800 border-violet-200',
  PRACTICE: 'bg-slate-100 text-slate-800 border-slate-200',
};

const TEST_TYPE_OPTIONS = [
  { value: 'ACADEMIC', label: 'Academic', className: TEST_TYPE_BADGE.ACADEMIC },
  { value: 'GENERAL_TRAINING', label: 'General Training', className: TEST_TYPE_BADGE.GENERAL_TRAINING },
  { value: 'BOTH', label: 'Both', className: TEST_TYPE_BADGE.BOTH },
  { value: 'FULL_TEST', label: 'Full Test', className: TEST_TYPE_BADGE.FULL_TEST },
  { value: 'PRACTICE', label: 'Practice', className: TEST_TYPE_BADGE.PRACTICE },
];

const STATUS_OPTIONS = [
  { value: 'PUBLISHED', label: 'Sẵn sàng' },
  { value: 'HIDDEN', label: 'Ẩn' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Sẵn sàng',
  HIDDEN: 'Ẩn',
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PUBLISHED: 'bg-green-100 text-green-800 border-green-200',
  HIDDEN: 'bg-gray-100 text-gray-600 border-gray-200',
};

const SECTION_LABEL_BY_SKILL: Record<string, string> = {
  READING: 'Passage',
  LISTENING: 'Section',
  WRITING: 'Task',
  SPEAKING: 'Part',
};

export default function FullTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const testId = Number(params.id);
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    title: string;
    testType: string;
    duration: number;
    status: string;
  }>({ title: '', testType: 'PRACTICE', duration: 0, status: 'PUBLISHED' });
  const [selectedBySection, setSelectedBySection] = useState<Record<number, number>>({});

  const { data: fullTest, isLoading, error } = useQuery({
    queryKey: ['full-test', testId],
    queryFn: () => getFullTestById(testId),
    enabled: !isNaN(testId),
  });

  const { data: availableStimuli = {} } = useQuery({
    queryKey: ['full-test-stimuli', fullTest?.skill],
    queryFn: () => getAvailableStimuli(fullTest!.skill),
    enabled: !!fullTest?.skill,
    staleTime: 30_000,
  });

  const sortedStimuli = useMemo(
    () => [...(fullTest?.stimuli ?? [])].sort((a, b) => (a.section ?? 0) - (b.section ?? 0)),
    [fullTest?.stimuli]
  );

  const sectionLabel = SECTION_LABEL_BY_SKILL[fullTest?.skill ?? ''] ?? 'Section';

  const initializeEditingState = () => {
    if (!fullTest) return;
    setEditData({
      title: fullTest.title,
      testType: fullTest.testType || 'PRACTICE',
      duration: fullTest.duration || 0,
      status: fullTest.status || 'PUBLISHED',
    });
    const initialSelected: Record<number, number> = {};
    for (const item of fullTest.stimuli ?? []) {
      if (item.section && item.id) {
        initialSelected[item.section] = item.id;
      }
    }
    setSelectedBySection(initialSelected);
  };

  const readingQuestionTotal = useMemo(() => {
    if (fullTest?.skill !== 'READING') return null;

    return sortedStimuli.reduce((sum, stimulus) => {
      const section = stimulus.section ?? 0;
      const selectedId = selectedBySection[section] ?? stimulus.id;
      const option = (availableStimuli[section] ?? []).find((item) => item.stimulusId === selectedId);
      if (option) return sum + option.questionCount;
      return sum + (stimulus.questionCount ?? 0);
    }, 0);
  }, [availableStimuli, fullTest?.skill, selectedBySection, sortedStimuli]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof editData }) => {
      const stimulusIds = sortedStimuli.map((stimulus) => selectedBySection[stimulus.section] ?? stimulus.id);
      return updateFullTest(id, {
        title: data.title,
        testType: data.testType,
        duration: data.duration,
        status: data.status,
        stimulusIds,
      });
    },
    onSuccess: () => {
      toast.success('Đã cập nhật Full Test');
      queryClient.invalidateQueries({ queryKey: ['full-test', testId] });
      queryClient.invalidateQueries({ queryKey: ['full-tests'] });
      setIsEditing(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Cập nhật thất bại');
    },
  });

  const handleSave = () => {
    const stimulusIds = sortedStimuli.map((stimulus) => selectedBySection[stimulus.section] ?? stimulus.id);
    if (stimulusIds.some((id) => !id)) {
      toast.error('Vui lòng chọn đầy đủ stimulus cho các phần');
      return;
    }

    if (fullTest?.skill === 'READING' && readingQuestionTotal !== 40) {
      toast.error(`Reading phải đủ 40 câu (hiện tại: ${readingQuestionTotal ?? 0})`);
      return;
    }

    updateMutation.mutate({ id: testId, data: editData });
  };

  const handleCancel = () => {
    initializeEditingState();
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Chi tiết Full Test" />
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !fullTest) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Chi tiết Full Test" />
        <div className="flex-1 p-6">
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Không tìm thấy Full Test</p>
            <p className="text-sm mt-2">Full Test này có thể đã bị xóa hoặc không tồn tại.</p>
            <Button className="mt-4" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader title="Chi tiết Full Test" />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  initializeEditingState();
                  setIsEditing(true);
                }}
              >
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Thông tin cơ bản</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Tên đề</Label>
              {isEditing ? (
                <Input
                  id="title"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                />
              ) : (
                <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm">{fullTest.title}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill">Kỹ năng</Label>
              <div className="rounded-md border bg-gray-50 px-3 py-2">
                <Badge className={SKILL_BADGE[fullTest.skill] ?? 'bg-gray-100 text-gray-700'}>{fullTest.skill}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testType">Loại bài thi</Label>
              {isEditing ? (
                <select
                  id="testType"
                  value={editData.testType}
                  onChange={(e) => setEditData({ ...editData, testType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TEST_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Badge
                  className={
                    TEST_TYPE_OPTIONS.find((t) => t.value === fullTest.testType)?.className ?? 'bg-gray-100 text-gray-700'
                  }
                >
                  {TEST_TYPE_OPTIONS.find((t) => t.value === fullTest.testType)?.label || fullTest.testType || 'Practice'}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Thời gian (phút)</Label>
              {isEditing ? (
                <Input
                  id="duration"
                  type="number"
                  value={editData.duration}
                  onChange={(e) => setEditData({ ...editData, duration: Number(e.target.value) })}
                />
              ) : (
                <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm">
                  {fullTest.duration ? `${Math.floor(fullTest.duration / 60)} phút` : 'Không giới hạn'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              {isEditing ? (
                <select
                  id="status"
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Badge className={STATUS_BADGE[fullTest.status] ?? 'bg-gray-100 text-gray-700'}>
                  {STATUS_LABEL[fullTest.status] ?? fullTest.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-800">Các phần (Sections)</h3>
            {fullTest.skill === 'READING' && (
              <Badge className={readingQuestionTotal === 40 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                Tổng câu Reading: {readingQuestionTotal ?? 0}/40
              </Badge>
            )}
          </div>

          {sortedStimuli.length > 0 ? (
            <div className="space-y-3">
              {sortedStimuli.map((stimulus, index) => {
                const section = stimulus.section || index + 1;
                const selectedId = selectedBySection[section] ?? stimulus.id;
                const sectionOptions = availableStimuli[section] ?? [];
                const selectedOption = sectionOptions.find((opt) => opt.stimulusId === selectedId);
                const displayTitle = selectedOption?.title || stimulus.title || `${sectionLabel} ${section}`;
                const displayQuestionCount = selectedOption?.questionCount ?? stimulus.questionCount;
                const sourceTestId = selectedOption?.testId ?? stimulus.testId;

                return (
                  <div key={stimulus.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {section}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{displayTitle}</p>
                          <p className="text-xs text-gray-500">Stimulus ID: {selectedId}</p>
                          {fullTest.skill === 'READING' && typeof displayQuestionCount === 'number' && (
                            <p className="text-xs text-blue-700">Số câu: {displayQuestionCount}</p>
                          )}
                          {sourceTestId ? (
                            <Link
                              href={`/admin/tests/${sourceTestId}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              Xem test detail
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : null}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="w-full max-w-sm">
                          <Label className="mb-1 block text-xs text-gray-600">Đổi stimulus cho phần này</Label>
                          <select
                            value={selectedId}
                            onChange={(e) =>
                              setSelectedBySection((prev) => ({
                                ...prev,
                                [section]: Number(e.target.value),
                              }))
                            }
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {sectionOptions.length === 0 ? (
                              <option value={stimulus.id}>{stimulus.title || `Stimulus ${stimulus.id}`}</option>
                            ) : (
                              sectionOptions.map((opt) => (
                                <option key={opt.stimulusId} value={opt.stimulusId}>
                                  {opt.title}
                                  {fullTest.skill === 'READING' ? ` (${opt.questionCount} câu)` : ''}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Không có section nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
