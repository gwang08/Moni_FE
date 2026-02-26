'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Pencil, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { getTestDetail } from '@/lib/tests-api';
import type { TestDetailResponse } from '@/types/test.types';

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [test, setTest] = useState<TestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getTestDetail(id)
      .then(setTest)
      .catch(() => setError('Không thể tải thông tin bài thi'))
      .finally(() => setLoading(false));
  }, [id]);

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

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : error ? (
          <p className="text-red-500 text-center py-12">{error}</p>
        ) : test && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">{test.title}</h2>
              <p className="text-gray-600 text-sm mb-4">{test.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{test.skill}</Badge>
                <Badge variant="outline">{test.testType}</Badge>
                <span className="text-xs text-gray-400 self-center">
                  Tạo: {new Date(test.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            {test.stimuli.map((stimulus, si) => (
              <div key={stimulus.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Stimulus #{si + 1}</h3>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 mb-4 whitespace-pre-wrap">{stimulus.content}</p>
                {stimulus.mediaUrl && (
                  <p className="text-xs text-blue-500 mb-4">Media: <a href={stimulus.mediaUrl} target="_blank" rel="noopener noreferrer">{stimulus.mediaUrl}</a></p>
                )}

                <div className="space-y-4">
                  {stimulus.questions.map((question, qi) => (
                    <div key={question.id} className="border border-gray-100 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-800 mb-3">Câu {qi + 1}: {question.content}</p>
                      <div className="space-y-1.5">
                        {question.options.map((option) => (
                          <div key={option.id} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                            option.isCorrect ? 'bg-green-50 text-green-700 border border-green-200' : 'text-gray-600'
                          }`}>
                            <span>{option.isCorrect ? '✓' : '○'}</span>
                            <span>{option.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
