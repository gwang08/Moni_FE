'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminHeader } from '@/components/admin/admin-header';
import { getTestDetail } from '@/lib/tests-api';
import { updateTest } from '@/lib/admin-api';

const TEST_TYPES = ['MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'MATCHING', 'TRUE_FALSE'];

export default function TestEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [testType, setTestType] = useState('');

  useEffect(() => {
    if (!id) return;
    getTestDetail(id)
      .then(test => {
        setTitle(test.title);
        setDescription(test.description);
        setTestType(test.testType);
      })
      .catch(() => setError('Không thể tải thông tin bài thi'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    setSubmitting(true);
    setError('');
    try {
      await updateTest(id as string, { title, description, testType });
      setSuccess('Cập nhật thành công!');
      setTimeout(() => router.push(`/admin/tests/${id}`), 1000);
    } catch {
      setError('Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminHeader title="Chỉnh sửa bài thi" />
      <div className="p-6 max-w-2xl">
        <Button variant="outline" size="sm" className="mb-6" onClick={() => router.push(`/admin/tests/${id}`)}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="title" className="mb-1.5 block text-sm font-medium">Tiêu đề *</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề bài thi" />
              </div>

              <div>
                <Label htmlFor="description" className="mb-1.5 block text-sm font-medium">Mô tả</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mô tả bài thi"
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div>
                <Label htmlFor="testType" className="mb-1.5 block text-sm font-medium">Loại bài thi</Label>
                <select
                  id="testType"
                  value={testType}
                  onChange={e => setTestType(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/admin/tests/${id}`)}>Hủy</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
