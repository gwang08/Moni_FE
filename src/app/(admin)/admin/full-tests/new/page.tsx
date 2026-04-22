'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, Search, X } from 'lucide-react';
import { AdminHeader } from '@/components/admin/admin-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createFullTest, getAvailableStimuli } from '@/lib/admin-full-test-api';
import type { StimulusOption } from '@/lib/admin-full-test-api';

const SKILLS = ['READING', 'LISTENING', 'WRITING', 'SPEAKING'] as const;
type Skill = (typeof SKILLS)[number];

type SortKey = 'TITLE_ASC' | 'TITLE_DESC' | 'QUESTION_DESC' | 'QUESTION_ASC';

const SKILL_LABELS: Record<Skill, string> = {
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

const SECTION_COUNT: Record<Skill, number> = {
  READING: 3,
  LISTENING: 4,
  WRITING: 2,
  SPEAKING: 3,
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'TITLE_ASC', label: 'Tên A-Z' },
  { value: 'TITLE_DESC', label: 'Tên Z-A' },
  { value: 'QUESTION_DESC', label: 'Số câu giảm dần' },
  { value: 'QUESTION_ASC', label: 'Số câu tăng dần' },
];

export default function AdminFullTestCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [skill, setSkill] = useState<Skill | null>(null);
  const [testType, setTestType] = useState<string>('ACADEMIC');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');

  const [activeSection, setActiveSection] = useState(1);
  const [selected, setSelected] = useState<Record<number, number>>({});

  const [searchInputBySection, setSearchInputBySection] = useState<Record<number, string>>({});
  const [searchBySection, setSearchBySection] = useState<Record<number, string>>({});
  const [sortBySection, setSortBySection] = useState<Record<number, SortKey>>({});

  const sectionCount = skill ? SECTION_COUNT[skill] : 0;
  const sectionLabel =
    skill === 'SPEAKING' ? 'Part' : skill === 'WRITING' ? 'Task' : skill === 'READING' ? 'Passage' : 'Section';

  const handleSkillChange = (nextSkill: Skill) => {
    setSkill(nextSkill);
    if (nextSkill === 'READING' || nextSkill === 'WRITING') {
      setTestType('ACADEMIC');
    } else {
      setTestType('');
    }
    setActiveSection(1);
    setSelected({});
    setSearchInputBySection({});
    setSearchBySection({});
    setSortBySection({});
  };

  const handleTestTypeChange = (nextType: string) => {
    setTestType(nextType);
    setSelected({});
    setSearchInputBySection({});
    setSearchBySection({});
    setSortBySection({});
  };

  const { data: stimuliMap, isLoading } = useQuery({
    queryKey: ['full-test-stimuli', skill, testType],
    queryFn: () => getAvailableStimuli(skill!, testType),
    enabled: !!skill,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: createFullTest,
    onSuccess: () => {
      toast.success('Tạo Full Test thành công!');
      queryClient.invalidateQueries({ queryKey: ['full-tests'] });
      router.push('/admin/full-tests');
    },
    onError: (err: Error) => toast.error(err.message || 'Tạo Full Test thất bại'),
  });

  const activeOptions = useMemo(() => {
    const options = stimuliMap?.[activeSection] ?? [];
    const keyword = (searchBySection[activeSection] ?? '').trim().toLowerCase();
    const sort = sortBySection[activeSection] ?? 'TITLE_ASC';

    let filtered = options;
    if (keyword) {
      filtered = filtered.filter((opt) => opt.title.toLowerCase().includes(keyword));
    }

    return [...filtered].sort((a, b) => {
      if (sort === 'TITLE_ASC') return a.title.localeCompare(b.title);
      if (sort === 'TITLE_DESC') return b.title.localeCompare(a.title);
      if (sort === 'QUESTION_DESC') return b.questionCount - a.questionCount;
      return a.questionCount - b.questionCount;
    });
  }, [stimuliMap, activeSection, searchBySection, sortBySection]);

  const selectedSummary = useMemo(() => {
    if (!stimuliMap || !skill) return [] as Array<{ section: number; item: StimulusOption }>;

    return Array.from({ length: sectionCount }, (_, i) => i + 1)
      .map((sec) => {
        const chosenId = selected[sec];
        const item = (stimuliMap[sec] ?? []).find((opt) => opt.stimulusId === chosenId);
        return item ? { section: sec, item } : null;
      })
      .filter((v): v is { section: number; item: StimulusOption } => v !== null);
  }, [stimuliMap, skill, sectionCount, selected]);

  const selectedCount = Object.keys(selected).length;
  const allSectionsSelected = sectionCount > 0 && selectedCount === sectionCount;
  const totalReadingQuestions = useMemo(() => {
    if (skill !== 'READING') return null;
    return selectedSummary.reduce((sum, { item }) => sum + (item.questionCount || 0), 0);
  }, [selectedSummary, skill]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchBySection((prev) => ({
        ...prev,
        [activeSection]: searchInputBySection[activeSection] ?? '',
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [activeSection, searchInputBySection]);

  const handleCreate = () => {
    if (!skill || !title.trim() || !allSectionsSelected) return;
    if (skill === 'READING' && totalReadingQuestions !== 40) {
      toast.error(`Reading phải đủ 40 câu (hiện tại: ${totalReadingQuestions ?? 0})`);
      return;
    }

    const stimulusIds = Array.from({ length: sectionCount }, (_, i) => selected[i + 1]).filter(
      (id): id is number => typeof id === 'number'
    );

    createMutation.mutate({
      title: title.trim(),
      skill,
      testType: testType || undefined,
      duration: duration ? parseInt(duration, 10) : undefined,
      stimulusIds,
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader title="Tạo Full Test" />

      <div className="flex-1 p-6 space-y-6">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/full-tests')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>

        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-800">Thông tin Full Test</h3>

          <div className="space-y-2">
            <Label>Kỹ năng *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {SKILLS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSkillChange(s)}
                  className={`h-11 rounded-lg border-2 text-sm font-medium transition-colors ${
                    skill === s
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {SKILL_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {(skill === 'READING' || skill === 'WRITING') && (
            <div className="space-y-2">
              <Label>Loại bài thi *</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="testType"
                    value="ACADEMIC"
                    checked={testType === 'ACADEMIC'}
                    onChange={(e) => handleTestTypeChange(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className={`text-sm font-medium transition-colors ${testType === 'ACADEMIC' ? 'text-blue-700' : 'text-gray-600 group-hover:text-gray-900'}`}>
                    Academic
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="testType"
                    value="GENERAL_TRAINING"
                    checked={testType === 'GENERAL_TRAINING'}
                    onChange={(e) => handleTestTypeChange(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className={`text-sm font-medium transition-colors ${testType === 'GENERAL_TRAINING' ? 'text-blue-700' : 'text-gray-600 group-hover:text-gray-900'}`}>
                    General Training
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                placeholder="Ví dụ: 120"
              />
            </div>
          </div>
        </div>

        {skill && (
          <div className="bg-white border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-base font-semibold text-gray-800">Chọn Stimulus Theo Từng {sectionLabel}</h3>
              <p className="text-sm text-gray-500">
                Đã chọn {selectedCount}/{sectionCount} {sectionLabel.toLowerCase()}
              </p>
            </div>
            {skill === 'READING' && (
              <div
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  totalReadingQuestions === 40 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                Tổng câu Reading: {totalReadingQuestions ?? 0}/40
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {Array.from({ length: sectionCount }, (_, i) => i + 1).map((sec) => {
                const chosen = !!selected[sec];
                return (
                  <button
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                      activeSection === sec
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {sectionLabel} {sec} {chosen ? '• Đã chọn' : ''}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              <div className="xl:col-span-2 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                  <div className="relative">
                    <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={searchInputBySection[activeSection] ?? ''}
                      onChange={(e) =>
                        setSearchInputBySection((prev) => ({ ...prev, [activeSection]: e.target.value }))
                      }
                      className="pl-10"
                      placeholder={`Tìm ${sectionLabel.toLowerCase()} ${activeSection}...`}
                    />
                  </div>
                  <select
                    value={sortBySection[activeSection] ?? 'TITLE_ASC'}
                    onChange={(e) =>
                      setSortBySection((prev) => ({
                        ...prev,
                        [activeSection]: e.target.value as SortKey,
                      }))
                    }
                    className="h-10 rounded-md border border-gray-200 px-3 text-sm bg-white"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        Sắp xếp: {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border rounded-lg divide-y max-h-[420px] overflow-y-auto">
                  {isLoading ? (
                    <p className="p-4 text-sm text-gray-500">Đang tải danh sách stimulus...</p>
                  ) : activeOptions.length === 0 ? (
                    <p className="p-4 text-sm text-amber-600">
                      Chưa có stimulus cho {sectionLabel} {activeSection} hoặc không có kết quả phù hợp.
                    </p>
                  ) : (
                    activeOptions.map((opt) => {
                      const isChosen = selected[activeSection] === opt.stimulusId;
                      return (
                        <div key={opt.stimulusId} className="p-3 flex items-center gap-3">
                          <div className="w-16 h-16 rounded-md border bg-gray-50 flex items-center justify-center text-gray-400">
                            <FileText className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-blue-600 truncate">{opt.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {skill === 'READING' ? `${opt.questionCount} câu` : null}
                            </p>
                          </div>

                          {isChosen ? (
                            <Button
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() =>
                                setSelected((prev) => {
                                  const next = { ...prev };
                                  delete next[activeSection];
                                  return next;
                                })
                              }
                            >
                              <X className="h-4 w-4 mr-1" /> Bỏ chọn
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() =>
                                setSelected((prev) => ({
                                  ...prev,
                                  [activeSection]: opt.stimulusId,
                                }))
                              }
                            >
                              Chọn
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-3 h-fit bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-2">Danh sách đã chọn</p>
                {selectedSummary.length === 0 ? (
                  <p className="text-xs text-gray-500">Chưa có stimulus nào.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSummary.map(({ section, item }) => (
                      <div key={section} className="rounded-md border bg-white p-2">
                        <p className="text-xs font-medium text-gray-700">
                          {sectionLabel} {section}
                        </p>
                        <p className="text-xs text-gray-600 truncate mt-1">{item.title}</p>
                        <div className="mt-2 flex items-center justify-between">
                          {skill === 'READING' ? (
                            <Badge variant="secondary" className="text-[11px]">
                              {item.questionCount} câu
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-gray-400">{sectionLabel} đã chọn</span>
                          )}
                          <button
                            onClick={() =>
                              setSelected((prev) => {
                                const next = { ...prev };
                                delete next[section];
                                return next;
                              })
                            }
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Bỏ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/full-tests')}>Hủy</Button>
          <Button
            disabled={
              !skill ||
              !title.trim() ||
              !allSectionsSelected ||
              createMutation.isPending ||
              (skill === 'READING' && totalReadingQuestions !== 40)
            }
            onClick={handleCreate}
          >
            {createMutation.isPending ? 'Đang tạo...' : 'Tạo Full Test'}
          </Button>
        </div>
      </div>
    </div>
  );
}
