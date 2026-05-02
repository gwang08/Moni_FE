'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ADMIN_TEST_SKILL_BADGES,
  ADMIN_TEST_STATUS_LABELS,
  ADMIN_TEST_TYPE_BADGES,
  ADMIN_TEST_TYPE_LABELS,
  ADMIN_QUESTION_TYPE_LABELS,
} from '@/components/admin/admin-test-badges';
import { getTests } from '@/lib/tests-api';
import { SkeletonTable } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SKILLS = ['ALL', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'] as const;
const SKILL_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

function getTestSectionLabel(test: { skill: string; section?: number | null }) {
  if (test.section == null) return '-';
  if (test.skill === 'READING') return `Passage ${test.section}`;
  if (test.skill === 'LISTENING') return `Section ${test.section}`;
  if (test.skill === 'WRITING') return `Task ${test.section}`;
  if (test.skill === 'SPEAKING') return `Part ${test.section}`;
  return String(test.section);
}

type SortOption = 'title-asc' | 'title-desc' | 'created-asc' | 'created-desc' | 'availability-asc' | 'availability-desc';

export default function AdminTestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const sortFromUrl = searchParams.get('sort') || '';
  const skillFromUrl = searchParams.get('skill') || 'ALL';
  const keywordFromUrl = searchParams.get('keyword') || '';

  const [page, setPage] = useState(pageFromUrl);
  const [skillFilter, setSkillFilter] = useState<string>(skillFromUrl);
  const [keywordInput, setKeywordInput] = useState(keywordFromUrl);
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [sort, setSort] = useState<SortOption | ''>(sortFromUrl as SortOption | '');
  const [readingPassage, setReadingPassage] = useState('');
  const [readingQuestionType, setReadingQuestionType] = useState('');
  const [readingTestType, setReadingTestType] = useState('');
  const [listeningSection, setListeningSection] = useState('');
  const [listeningQuestionType, setListeningQuestionType] = useState('');
  const [writingTask, setWritingTask] = useState('');
  const [writingTestType, setWritingTestType] = useState('');
  const [speakingPart, setSpeakingPart] = useState('');
  const [speakingTopic, setSpeakingTopic] = useState('');
  const [speakingTestType, setSpeakingTestType] = useState('');

  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });
      return newParams.toString();
    },
    [searchParams]
  );

  const updateUrl = useCallback(
    (updates: Record<string, string | number | null>) => {
      const queryString = createQueryString(updates);
      router.push(`${pathname}?${queryString}`, { scroll: false });
    },
    [pathname, router, createQueryString]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keywordInput !== keyword) {
        setKeyword(keywordInput);
        updateUrl({ keyword: keywordInput || null, page: 1 });
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [keywordInput, updateUrl, keyword]);

  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  useEffect(() => {
    setSort(sortFromUrl as SortOption | '');
  }, [sortFromUrl]);

  useEffect(() => {
    setSkillFilter(skillFromUrl);
  }, [skillFromUrl]);

  const activeSkill = skillFilter === 'ALL' ? undefined : skillFilter;

  const currentSection = useMemo(() => {
    if (activeSkill === 'READING') return readingPassage ? parseInt(readingPassage) : undefined;
    if (activeSkill === 'LISTENING') return listeningSection ? parseInt(listeningSection) : undefined;
    if (activeSkill === 'WRITING') return writingTask ? parseInt(writingTask) : undefined;
    if (activeSkill === 'SPEAKING') return speakingPart ? parseInt(speakingPart) : undefined;
    return undefined;
  }, [activeSkill, readingPassage, listeningSection, writingTask, speakingPart]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'tests', page, skillFilter, keyword, sort, currentSection],
    queryFn: () => getTests(page, 20, activeSkill, keyword || undefined, currentSection, sort || undefined),
    staleTime: 30_000,
  });

  const tests = useMemo(() => data?.content ?? [], [data?.content]);
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const sectionOptions = useMemo(
    () => Array.from(new Set(tests.map(t => t.section).filter((s): s is number => s != null))).sort((a, b) => a - b),
    [tests]
  );

  const questionTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          tests
            .flatMap(t => t.questionTypes ?? [])
            .filter((qt): qt is string => Boolean(qt))
        )
      ).sort(),
    [tests]
  );

  const testTypeOptions = useMemo(
    () => Array.from(new Set(tests.map(t => t.testType).filter((type): type is string => Boolean(type)))).sort(),
    [tests]
  );

  const filteredTests = useMemo(() => {
    const norm = (v: string | null | undefined) => (v ?? '').toLowerCase().trim();
    const matchQuestionType = (testQuestionTypes: string[] | undefined, target: string) =>
      !target || (testQuestionTypes ?? []).includes(target);

    if (activeSkill === 'READING') {
      return tests.filter(test => {
        const passageOk = !readingPassage || String(test.section ?? '') === readingPassage;
        const questionTypeOk = matchQuestionType(test.questionTypes, readingQuestionType);
        const testTypeOk = !readingTestType || test.testType === readingTestType;
        return passageOk && questionTypeOk && testTypeOk;
      });
    }

    if (activeSkill === 'LISTENING') {
      return tests.filter(test => {
        const sectionOk = !listeningSection || String(test.section ?? '') === listeningSection;
        const questionTypeOk = matchQuestionType(test.questionTypes, listeningQuestionType);
        return sectionOk && questionTypeOk;
      });
    }

    if (activeSkill === 'WRITING') {
      return tests.filter(test => {
        const taskOk = !writingTask || String(test.section ?? '') === writingTask;
        const testTypeOk = !writingTestType || test.testType === writingTestType;
        return taskOk && testTypeOk;
      });
    }

    if (activeSkill === 'SPEAKING') {
      return tests.filter(test => {
        const partOk = !speakingPart || String(test.section ?? '') === speakingPart;
        const topicOk = !speakingTopic || norm(test.title).includes(norm(speakingTopic));
        const testTypeOk = !speakingTestType || test.testType === speakingTestType;
        return partOk && topicOk && testTypeOk;
      });
    }

    return tests;
  }, [
    activeSkill,
    tests,
    readingPassage,
    readingQuestionType,
    readingTestType,
    listeningSection,
    listeningQuestionType,
    writingTask,
    writingTestType,
    speakingPart,
    speakingTopic,
    speakingTestType,
  ]);

  return (
    <div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="inline-block px-4 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: '#dcebfe' }}>
            Tất cả phần thi
          </div>
          <Button onClick={() => router.push('/admin/tests/import')}>
            <Plus className="h-4 w-4" /> Tạo bài thi
          </Button>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex gap-2 items-center w-full">
            <Input
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              placeholder="Tìm kiếm"
              className="flex-1"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  Sắp xếp
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setSort('title-asc'); updateUrl({ sort: 'title-asc', page: 1 }); setPage(1); }}>
                  <ArrowUp className="h-3 w-3 mr-2" />
                  Tiêu đề (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSort('title-desc'); updateUrl({ sort: 'title-desc', page: 1 }); setPage(1); }}>
                  <ArrowDown className="h-3 w-3 mr-2" />
                  Tiêu đề (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSort('created-asc'); updateUrl({ sort: 'created-asc', page: 1 }); setPage(1); }}>
                  <ArrowUp className="h-3 w-3 mr-2" />
                  Ngày tạo (Cũ → Mới)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSort('created-desc'); updateUrl({ sort: 'created-desc', page: 1 }); setPage(1); }}>
                  <ArrowDown className="h-3 w-3 mr-2" />
                  Ngày tạo (Mới → Cũ)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSort('availability-asc'); updateUrl({ sort: 'availability-asc', page: 1 }); setPage(1); }}>
                  <ArrowUp className="h-3 w-3 mr-2" />
                  Khả dụng (Cũ → Mới)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSort('availability-desc'); updateUrl({ sort: 'availability-desc', page: 1 }); setPage(1); }}>
                  <ArrowDown className="h-3 w-3 mr-2" />
                  Khả dụng (Mới → Cũ)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-2">
            {SKILLS.map(skill => (
              <button
                key={skill}
                onClick={() => {
                  setSkillFilter(skill);
                  updateUrl({ skill: skill === 'ALL' ? null : skill, page: 1 });
                  setPage(1);
                  setReadingPassage('');
                  setReadingQuestionType('');
                  setReadingTestType('');
                  setListeningSection('');
                  setListeningQuestionType('');
                  setWritingTask('');
                  setWritingTestType('');
                  setSpeakingPart('');
                  setSpeakingTopic('');
                  setSpeakingTestType('');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  skillFilter === skill
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {SKILL_LABELS[skill]}
              </button>
            ))}
          </div>

          {activeSkill === 'READING' && (
            <div className="flex flex-wrap gap-2">
              <select
                value={readingPassage}
                onChange={e => { setReadingPassage(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-200 px-3 text-sm min-w-[120px]"
              >
                <option value="">Passage (tất cả)</option>
                {sectionOptions.map(section => (
                  <option key={section} value={String(section)}>
                    Passage {section}
                  </option>
                ))}
              </select>
              <select
                value={readingQuestionType}
                onChange={e => { setReadingQuestionType(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-200 px-3 text-sm min-w-[180px]"
              >
                <option value="">Dạng câu hỏi (tất cả)</option>
                {questionTypeOptions.map(qt => (
                  <option key={qt} value={qt}>
                    {ADMIN_QUESTION_TYPE_LABELS[qt] || qt}
                  </option>
                ))}
              </select>
              <select
                value={readingTestType}
                onChange={e => { setReadingTestType(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-200 px-3 text-sm min-w-[140px]"
              >
                <option value="">Loại đề (tất cả)</option>
                {testTypeOptions.map(type => (
                  <option key={type} value={type}>
                    {ADMIN_TEST_TYPE_LABELS[type] || type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeSkill === 'LISTENING' && (
            <div className="flex flex-wrap gap-2">
              <select
                value={listeningSection}
                onChange={e => { setListeningSection(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-200 px-3 text-sm min-w-[120px]"
              >
                <option value="">Section (tất cả)</option>
                {sectionOptions.map(section => (
                  <option key={section} value={String(section)}>
                    Section {section}
                  </option>
                ))}
              </select>
              <select
                value={listeningQuestionType}
                onChange={e => { setListeningQuestionType(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-200 px-3 text-sm min-w-[180px]"
              >
                <option value="">Dạng câu hỏi (tất cả)</option>
                {questionTypeOptions.map(qt => (
                  <option key={qt} value={qt}>
                    {ADMIN_QUESTION_TYPE_LABELS[qt] || qt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeSkill === 'WRITING' && (
            <div className="flex flex-wrap gap-2">
              <select
                value={writingTask}
                onChange={e => { setWritingTask(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-200 px-3 text-sm min-w-[120px]"
              >
                <option value="">Task (tất cả)</option>
                {sectionOptions.map(section => (
                  <option key={section} value={String(section)}>
                    Task {section}
                  </option>
                ))}
              </select>
              <select
                value={writingTestType}
                onChange={e => { setWritingTestType(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-200 px-3 text-sm min-w-[140px]"
              >
                <option value="">Dạng đề (tất cả)</option>
                {testTypeOptions.map(type => (
                  <option key={type} value={type}>
                    {ADMIN_TEST_TYPE_LABELS[type] || type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeSkill === 'SPEAKING' && (
            <div className="flex flex-wrap gap-2">
              <select
                value={speakingPart}
                onChange={e => { setSpeakingPart(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-200 px-3 text-sm min-w-[120px]"
              >
                <option value="">Part (tất cả)</option>
                {sectionOptions.map(section => (
                  <option key={section} value={String(section)}>
                    Part {section}
                  </option>
                ))}
              </select>
              <Input
                value={speakingTopic}
                onChange={e => { setSpeakingTopic(e.target.value); setPage(1); }}
                placeholder="Chủ đề..."
                className="h-9 text-sm max-w-[200px]"
              />
              <select
                value={speakingTestType}
                onChange={e => { setSpeakingTestType(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-200 px-3 text-sm min-w-[140px]"
              >
                <option value="">Dạng đề (tất cả)</option>
                {testTypeOptions.map(type => (
                  <option key={type} value={type}>
                    {ADMIN_TEST_TYPE_LABELS[type] || type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 mb-4 text-sm">Không thể tải danh sách bài thi</p>}

        {!isLoading && (
          <p className="mb-3 text-sm text-gray-500 font-medium">
            {readingQuestionType || readingTestType || listeningQuestionType || writingTestType || speakingTopic || speakingTestType ? (
              <span>Tìm thấy {filteredTests.length} kết quả phù hợp (trên trang này)</span>
            ) : (
              <span>Có {totalElements} phần thi</span>
            )}
          </p>
        )}

        {isLoading ? (
          <SkeletonTable rows={5} cols={3} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className={activeSkill === 'LISTENING' ? 'w-[55%]' : 'w-[40%]'} />
                <col className={activeSkill === 'LISTENING' ? 'w-[20%]' : 'w-[15%]'} />
                <col className={activeSkill === 'LISTENING' ? 'w-[25%]' : 'w-[20%]'} />
                {activeSkill !== 'LISTENING' && <col className="w-[25%]" />}
              </colgroup>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tiêu đề</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Phần</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kỹ năng</th>
                  {activeSkill !== 'LISTENING' && <th className="px-4 py-3 text-left font-medium text-gray-600">Loại</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTests.length === 0 ? (
                  <tr>
                    <td colSpan={activeSkill === 'LISTENING' ? 3 : 4} className="text-center py-8 text-gray-400">
                      Chưa có bài thi nào
                    </td>
                  </tr>
                ) : (
                  filteredTests.map(test => (
                    <tr
                      key={test.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/tests/${test.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/tests/${test.id}`}
                            className="min-w-0 text-blue-600 hover:underline overflow-hidden"
                            title={test.title}
                            onClick={e => e.stopPropagation()}
                          >
                            <span className="block truncate text-sm">{test.title}</span>
                          </Link>
                          {test.status === 'HIDDEN' && (
                            <Badge
                              className="shrink-0 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold leading-none text-slate-600 transition-none hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-0 focus-visible:border-slate-300"
                            >
                              {ADMIN_TEST_STATUS_LABELS[test.status] || test.status}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-50 hover:text-slate-600">
                          {getTestSectionLabel(test)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={ADMIN_TEST_SKILL_BADGES[test.skill] || 'border bg-gray-100 text-gray-700 border-gray-200'}
                        >
                          {test.skill}
                        </Badge>
                      </td>
                      {activeSkill !== 'LISTENING' && (
                        <td className="px-4 py-3">
                          {test.testType ? (
                            <Badge
                              className={ADMIN_TEST_TYPE_BADGES[test.testType] || 'border bg-gray-100 text-gray-700 border-gray-200'}
                            >
                              {ADMIN_TEST_TYPE_LABELS[test.testType] || test.testType}
                            </Badge>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const newPage = page - 1;
                setPage(newPage);
                updateUrl({ page: newPage });
              }}
              className="px-2"
            >
              Trước
            </Button>

            {/* Pagination numbers */}
            {(() => {
              const pages = [];

              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (page > 4) pages.push('...');

                const start = Math.max(2, page - 2);
                const end = Math.min(totalPages - 1, page + 2);

                for (let i = start; i <= end; i++) {
                  if (!pages.includes(i)) pages.push(i);
                }

                if (page < totalPages - 3) pages.push('...');
                pages.push(totalPages);
              }

              return pages.map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                      ...
                    </span>
                  );
                }
                return (
                  <Button
                    key={`page-${p}`}
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setPage(p as number);
                      updateUrl({ page: p as number });
                    }}
                    className={`w-9 ${page === p ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    {p}
                  </Button>
                );
              });
            })()}

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                const newPage = page + 1;
                setPage(newPage);
                updateUrl({ page: newPage });
              }}
              className="px-2"
            >
              Sau
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
