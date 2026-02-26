'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminHeader } from '@/components/admin/admin-header';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { MediaFileCard } from '@/components/admin/media-file-card';
import { getMediaList } from '@/lib/admin-api';
import type { MediaResponse } from '@/types/admin.types';

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMediaList()
      .then(setMediaList)
      .catch(() => setError('Không thể tải danh sách media'))
      .finally(() => setLoading(false));
  }, []);

  const handleUploaded = (media: MediaResponse) => {
    setMediaList(prev => [media, ...prev]);
  };

  const handleDeleted = (id: string) => {
    setMediaList(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div>
      <AdminHeader title="Quản lý Media" />
      <div className="p-6">
        <MediaUploadZone onUploaded={handleUploaded} />

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : mediaList.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Chưa có file nào. Tải lên file đầu tiên.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{mediaList.length} file</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mediaList.map(media => (
                <MediaFileCard key={media.id} media={media} onDeleted={handleDeleted} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
