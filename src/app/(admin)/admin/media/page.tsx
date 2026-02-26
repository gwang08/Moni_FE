'use client';

import { useState } from 'react';
import { AdminHeader } from '@/components/admin/admin-header';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { MediaFileCard } from '@/components/admin/media-file-card';

export default function AdminMediaPage() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleUploaded = (url: string) => {
    setUploadedUrls(prev => [url, ...prev]);
  };

  const handleDeleted = (url: string) => {
    setUploadedUrls(prev => prev.filter(u => u !== url));
  };

  return (
    <div>
      <AdminHeader title="Quản lý Media" />
      <div className="p-6">
        <MediaUploadZone onUploaded={handleUploaded} />

        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 mb-6">
          Lưu ý: Backend chưa có API liệt kê media. Chỉ hiển thị file vừa upload trong phiên này.
        </p>

        {uploadedUrls.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Chưa có file nào. Tải lên file đầu tiên.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{uploadedUrls.length} file đã upload</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {uploadedUrls.map(url => (
                <MediaFileCard key={url} url={url} onDeleted={handleDeleted} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
