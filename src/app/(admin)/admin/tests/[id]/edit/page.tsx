'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { getTestDetail } from '@/lib/tests-api';
import { useQuery } from '@tanstack/react-query';
import { SkeletonPage } from '@/components/ui/skeleton';
import { TestEditBasicInfoTab } from '@/components/admin/test-edit-basic-info-tab';
import { TestEditContentTab } from '@/components/admin/test-edit-content-tab';
import { TestDetailWritingView } from '@/components/admin/test-detail-writing-view';
import { TestDetailSpeakingView } from '@/components/admin/test-detail-speaking-view';

const TABS = ['Thông tin cơ bản', 'Nội dung bài thi', 'Xem trước'];

export default function TestEditPage() {
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
    <div>
      <AdminHeader title="Chỉnh sửa bài thi" />
      <div className="p-6">
        <Button variant="outline" size="sm" className="mb-6" onClick={() => router.push(`/admin/tests/${id}`)}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>

        {isLoading ? (
          <SkeletonPage />
        ) : error ? (
          <p className="text-red-500 text-center py-12">Không thể tải thông tin bài thi</p>
        ) : test && (
          <>
            {/* Step indicator giống create */}
            <div className="flex items-center gap-2 mb-6">
              {TABS.map((label, i) => {
                const active = i === tabIndex;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTabIndex(i)}
                      className="flex items-center gap-2 group"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
                      }`}>{i + 1}</div>
                      <span className={`text-xs transition-colors ${active ? 'text-blue-600 font-medium' : 'text-gray-500 group-hover:text-gray-700'}`}>
                        {label}
                      </span>
                    </button>
                    {i < TABS.length - 1 && <div className="w-8 h-px bg-gray-300" />}
                  </div>
                );
              })}
            </div>

            {/* Tab 1: Thông tin cơ bản */}
            {tabIndex === 0 && <TestEditBasicInfoTab test={test} />}

            {/* Tab 2: Nội dung bài thi */}
            {tabIndex === 1 && <TestEditContentTab test={test} />}

            {/* Tab 3: Xem trước */}
            {tabIndex === 2 && (
              <div className="max-w-4xl space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">{test.title}</h2>
                  <p className="text-gray-600 text-sm mb-4">{test.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{test.skill}</Badge>
                    {test.testMode && <Badge variant="outline">{test.testMode === 'PRACTICE' ? 'Bài lẻ' : 'Full đề'}</Badge>}
                    {test.status && <Badge variant="outline">{test.status}</Badge>}
                    {test.duration && <span className="text-xs text-gray-500 self-center">{test.duration} phút</span>}
                  </div>
                </div>

                {test.skill === 'WRITING' && <TestDetailWritingView stimuli={test.stimuli} />}
                {test.skill === 'SPEAKING' && <TestDetailSpeakingView stimuli={test.stimuli} />}

                {(test.skill === 'READING' || test.skill === 'LISTENING') && test.stimuli.map((stimulus, si) => (
                  <div key={stimulus.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      {stimulus.title || `Passage ${si + 1}`}
                    </h3>
                    {test.skill === 'LISTENING' && stimulus.mediaUrl && (
                      <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-purple-700 mb-1">Audio</p>
                        <audio controls src={stimulus.mediaUrl} className="w-full h-8" />
                      </div>
                    )}
                    <div
                      className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 mb-4 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: stimulus.content }}
                    />
                    {stimulus.questionGroups.map((group, gi) => (
                      <div key={group.id} className="mt-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Nhóm {gi + 1}
                          </span>
                          <span className="text-xs text-gray-400">{group.questions.length} câu</span>
                        </div>
                        {group.instruction && (
                          <p className="text-xs text-gray-500 italic">{group.instruction}</p>
                        )}
                        {group.questions.map((question) => (
                          <div key={question.id} className="border border-gray-100 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-800 mb-3">
                              Câu {question.position}: {question.content}
                            </p>
                            <div className="space-y-1.5">
                              {question.options.map((option) => (
                                <div key={option.id} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                                  option.isCorrect ? 'bg-green-50 text-green-700 border border-green-200' : 'text-gray-600'
                                }`}>
                                  {option.isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
                                  <span>{option.label && `${option.label}. `}{option.content}</span>
                                </div>
                              ))}
                            </div>
                            {(question.explanation?.text || question.explanation?.evidence) && (
                              <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                                {question.explanation.text && (
                                  <p className="text-xs text-gray-500">Giải thích: {question.explanation.text}</p>
                                )}
                                {question.explanation.evidence && (
                                  <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                    Dẫn chứng: &ldquo;{question.explanation.evidence}&rdquo;
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
          </>
        )}
      </div>
    </div>
  );
}
