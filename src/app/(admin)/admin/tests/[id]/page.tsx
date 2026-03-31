'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { getTestDetail } from '@/lib/tests-api';
import { formatReadingPassage } from '@/lib/format-reading-passage';
import { SkeletonPage } from '@/components/ui/skeleton';
import { TestEditBasicInfoTab } from '@/components/admin/test-edit-basic-info-tab';
import { TestEditContentTab } from '@/components/admin/test-edit-content-tab';
import { TestDetailWritingView } from '@/components/admin/test-detail-writing-view';
import { TestDetailSpeakingView } from '@/components/admin/test-detail-speaking-view';

const TABS = ['Thông tin cơ bản', 'Nội dung bài thi', 'Xem trước'];

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['admin', 'test', id],
    queryFn: () => getTestDetail(id),
    enabled: !!id,
    staleTime: 30_000,
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AdminHeader title="Chi tiết bài thi" />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
        <Button variant="outline" size="sm" className="mb-6" onClick={() => router.push('/admin/tests')}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>

        <div className="min-h-0 flex-1 overflow-hidden">
          {isLoading ? (
            <SkeletonPage />
          ) : error ? (
            <p className="py-12 text-center text-red-500">Không thể tải thông tin bài thi</p>
          ) : test && (
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="mb-6 flex items-center gap-2">
              {TABS.map((label, index) => {
                const active = index === tabIndex;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTabIndex(index)}
                      className="group flex items-center gap-2"
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                          active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className={`text-xs transition-colors ${active ? 'font-medium text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                        {label}
                      </span>
                    </button>
                    {index < TABS.length - 1 && <div className="h-px w-8 bg-gray-300" />}
                  </div>
                );
              })}
            </div>

            {tabIndex === 0 && <TestEditBasicInfoTab test={test} />}
            {tabIndex === 1 && (
              <div className="min-h-0 flex-1 overflow-hidden">
                <TestEditContentTab test={test} />
              </div>
            )}
            {tabIndex === 2 && (
              <div className="max-w-4xl space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-3 text-xl font-bold text-gray-800">{test.title}</h2>
                  <p className="mb-4 text-sm text-gray-600">{test.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{test.skill}</Badge>
                    {test.testMode && <Badge variant="outline">{test.testMode === 'PRACTICE' ? 'Bài lẻ' : 'Full đề'}</Badge>}
                    {test.status && <Badge variant="outline">{test.status}</Badge>}
                    {test.duration && <span className="self-center text-xs text-gray-500">{test.duration} phút</span>}
                  </div>
                </div>

                {test.skill === 'WRITING' && <TestDetailWritingView stimuli={test.stimuli} />}
                {test.skill === 'SPEAKING' && <TestDetailSpeakingView stimuli={test.stimuli} />}

                {(test.skill === 'READING' || test.skill === 'LISTENING') && test.stimuli.map((stimulus, stimulusIndex) => (
                  <div key={stimulus.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">
                      {stimulus.title || `Passage ${stimulusIndex + 1}`}
                    </h3>
                    {test.skill === 'LISTENING' && stimulus.mediaUrl && (
                      <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
                        <p className="mb-1 text-xs font-medium text-purple-700">Audio</p>
                        <audio controls src={stimulus.mediaUrl} className="h-8 w-full" />
                      </div>
                    )}
                    <div
                      className="prose prose-sm mb-4 max-w-none rounded-lg bg-gray-50 p-4 text-sm text-gray-700"
                      dangerouslySetInnerHTML={{ __html: formatReadingPassage(stimulus.content) }}
                    />

                    {stimulus.questionGroups.map((group, groupIndex) => (
                      <div key={group.id} className="mt-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                            Nhóm {groupIndex + 1}
                          </span>
                          <span className="text-xs text-gray-400">{group.questions.length} câu</span>
                        </div>
                        {group.instruction && <p className="text-xs italic text-gray-500">{group.instruction}</p>}

                        {group.questions.map((question) => (
                          <div key={question.id} className="rounded-lg border border-gray-100 p-4">
                            <p className="mb-3 text-sm font-medium text-gray-800">
                              Câu {question.position}: {question.content}
                            </p>
                            <div className="space-y-1.5">
                              {question.options.map((option) => (
                                <div
                                  key={option.id}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                    option.isCorrect ? 'border border-green-200 bg-green-50 text-green-700' : 'text-gray-600'
                                  }`}
                                >
                                  {option.isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
                                  <span>{option.label && `${option.label}. `}{option.content}</span>
                                </div>
                              ))}
                            </div>
                            {(question.explanation?.text || question.explanation?.evidence) && (
                              <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                                {question.explanation.text && (
                                  <p className="text-xs text-gray-500">Giải thích: {question.explanation.text}</p>
                                )}
                                {question.explanation.evidence && (
                                  <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
                                    Dẫn chứng: “{question.explanation.evidence}”
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
