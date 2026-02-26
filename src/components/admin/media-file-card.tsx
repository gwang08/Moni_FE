'use client';

import { useState } from 'react';
import { Trash2, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteMedia } from '@/lib/admin-api';
import type { MediaResponse } from '@/types/admin.types';

interface Props {
  media: MediaResponse;
  onDeleted: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaFileCard({ media, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isImage = media.contentType.startsWith('image/');

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMedia(media.id);
      onDeleted(media.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="h-36 bg-gray-100 flex items-center justify-center">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.fileName} className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-10 w-10 text-gray-400" />
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 truncate" title={media.fileName}>{media.fileName}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatBytes(media.size)} · {media.contentType.split('/')[1]?.toUpperCase()}</p>
        <p className="text-xs text-gray-400">{new Date(media.createdAt).toLocaleDateString('vi-VN')}</p>

        {confirmDelete ? (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setConfirmDelete(false)}>Hủy</Button>
            <Button size="sm" variant="destructive" className="flex-1 text-xs" disabled={deleting} onClick={handleDelete}>
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Xóa'}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="mt-2 w-full text-red-500 hover:text-red-700 text-xs"
            onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Xóa
          </Button>
        )}
      </div>
    </div>
  );
}
