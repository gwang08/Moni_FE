'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AdminHeader } from '@/components/admin/admin-header';
import { getTests } from '@/lib/tests-api';
import { SkeletonTable } from '@/components/ui/skeleton';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PUBLISHED: 'bg-green-100 text-green-800 border-green-200',
  HIDDEN: 'bg-gray-100 text-gray-600 border-gray-200',
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Sẵn sàng',
  HIDDEN: 'Ẩn',
};

const SKILLS = ['ALL', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'] as const;
const SKILL_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

export default function AdminTestsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [skillFilter, setSkillFilter] = useState<string>('ALL');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [readingPassage, setReadingPassage] = useState('');
  const [readingQuestionType, setReadingQuestionType] = useState('');
  const [readingTestType, setReadingTestType] = useState('');
  const [listeningSection, setListeningSection] = useState('');
  const [listeningQuestionType, setListeningQuestionType] = useState('');
  const [listeningTestType, setListeningTestType] = useState('');
  const [writingTask, setWritingTask] = useState('');
  const [writingTestType, setWritingTestType] = useState('');
  const [speakingPart, setSpeakingPart] = useState('');
  const [speakingTopic, setSpeakingTopic] = useState('');
  const [speakingTestType, setSpeakingTestType] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const activeSkill = skillFilter === 'ALL' ? undefined : skillFilter;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'tests', page, skillFilter, keyword],
    queryFn: () => getTests(page, 20, activeSkill, keyword || undefined),
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
        const testTypeOk = !listeningTestType || test.testType === listeningTestType;
        return sectionOk && questionTypeOk && testTypeOk;
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
    listeningTestType,
    writingTask,
    writingTestType,
    speakingPart,
    speakingTopic,
    speakingTestType,
  ]);

  return (
    <div>
      <AdminHeader title="Quản lý bài thi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">Danh sách tất cả bài thi trong hệ thống</p>
          <Button onClick={() => router.push('/admin/tests/import')}>
            <Plus className="h-4 w-4" /> Tạo bài thi
          </Button>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <Input
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            placeholder="Tìm kiếm bài thi..."
            className="max-w-sm"
          />
          <div className="flex gap-2">
            {SKILLS.map(skill => (
              <button
                key={skill}
                onClick={() => {
                  setSkillFilter(skill);
                  setPage(1);
                  setReadingPassage('');
                  setReadingQuestionType('');
                  setReadingTestType('');
                  setListeningSection('');
                  setListeningQuestionType('');
                  setListeningTestType('');
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={readingPassage}
                onChange={e => setReadingPassage(e.target.value)}
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
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
                onChange={e => setReadingQuestionType(e.target.value)}
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="">Dạng câu hỏi (tất cả)</option>
                {questionTypeOptions.map(qt => (
                  <option key={qt} value={qt}>
                    {qt}
                  </option>
                ))}
              </select>
              <select
                value={readingTestType}
                onChange={e => setReadingTestType(e.target.value)}
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="">Loại đề (tất cả)</option>
                {testTypeOptions.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeSkill === 'LISTENING' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={listeningSection}
                onChange={e => setListeningSection(e.target.value)}
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
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
                onChange={e => setListeningQuestionType(e.target.value)}
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="">Dạng câu hỏi (tất cả)</option>
                {questionTypeOptions.map(qt => (
                  <option key={qt} value={qt}>
                    {qt}
                  </option>
                ))}
              </select>
              <select
                value={listeningTestType}
                onChange={e => setListeningTestType(e.target.value)}
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="">Loại đề (tất cả)</option>
                {testTypeOptions.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeSkill === 'WRITING' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                value={writingTask}
                onChange={e => setWritingTask(e.target.value)}
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
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
                onChange={e => setWritingTestType(e.target.value)}
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="">Dạng đề (tất cả)</option>
                {testTypeOptions.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeSkill === 'SPEAKING' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={speakingPart}
                onChange={e => setSpeakingPart(e.target.value)}
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
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
                onChange={e => setSpeakingTopic(e.target.value)}
                placeholder="Chủ đề..."
                className="h-10"
              />
              <select
                value={speakingTestType}
                onChange={e => setSpeakingTestType(e.target.value)}
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="">Dạng đề (tất cả)</option>
                {testTypeOptions.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 mb-4 text-sm">Không thể tải danh sách bài thi</p>}

        {!isLoading && (
          <p className="mb-3 text-sm text-gray-500">
            Hiển thị {filteredTests.length} kết quả (trong {tests.length} mục của trang này, tổng {totalElements} mục)
          </p>
        )}

        {isLoading ? (
          <SkeletonTable rows={5} cols={4} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tiêu đề</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kỹ năng</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Loại</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">
                      Chưa có bài thi nào
                    </td>
                  </tr>
                ) : (
                  filteredTests.map(test => (
                    <tr
                      key={test.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/tests/${test.id}/edit`)}
                    >
                      <td className="px-4 py-3 font-medium max-w-xs truncate">
                        <Link
                          href={`/admin/tests/${test.id}/edit`}
                          className="text-blue-600 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {test.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{test.skill}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{test.testType}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`text-xs font-medium border ${
                            STATUS_COLORS[test.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {STATUS_LABELS[test.status] || test.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Trước
            </Button>
            <span className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Sau
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
