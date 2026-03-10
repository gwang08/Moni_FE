'use client';

import { useParams, useRouter } from 'next/navigation';
import { Loader2, Pencil, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { getTestDetail } from '@/lib/tests-api';
import { useQuery } from '@tanstack/react-query';

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['admin', 'test', id],
    queryFn: () => getTestDetail(id),
    enabled: !!id,
  });

  return (
    <div>
      <AdminHeader title="Chi tiết bài thi" />
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/tests')}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
          {test && (
            <Button size="sm" onClick={() => router.push(`/admin/tests/${id}/edit`)}>
              <Pencil className="h-4 w-4" /> Chỉnh sửa
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : error ? (
          <p className="text-red-500 text-center py-12">Không thể tải thông tin bài thi</p>
        ) : test && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">{test.title}</h2>
              <p className="text-gray-600 text-sm mb-4">{test.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{test.skill}</Badge>
                {test.status && <Badge variant="outline">{test.status}</Badge>}
                {test.duration && <span className="text-xs text-gray-500 self-center">{test.duration} phút</span>}
              </div>
            </div>

            {test.stimuli.map((stimulus, si) => (
              <div key={stimulus.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {stimulus.title || `Passage ${si + 1}`}
                </h3>
                <div
                  className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 mb-4 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: stimulus.content }}
                />
                {stimulus.mediaUrl && (
                  <p className="text-xs text-blue-500 mb-4">
                    Media: <a href={stimulus.mediaUrl} target="_blank" rel="noopener noreferrer">{stimulus.mediaUrl}</a>
                  </p>
                )}

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
      </div>
    </div>
  );
}
