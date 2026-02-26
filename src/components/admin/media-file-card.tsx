'use client';

import { useState } from 'react';
import { Trash2, FileText, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteMedia } from '@/lib/admin-api';

interface Props {
  url: string;
  onDeleted: (url: string) => void;
}

export function MediaFileCard({ url, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  const fileName = url.split('/').pop() || 'file';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMedia(url);
      onDeleted(url);
    } catch {
      setDeleting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="h-36 bg-gray-100 flex items-center justify-center">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={fileName} className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-10 w-10 text-gray-400" />
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-medium text-gray-800 truncate" title={fileName}>{fileName}</p>

        <Button size="sm" variant="ghost" className="mt-1 w-full text-xs text-gray-500" onClick={handleCopy}>
          {copied ? <><Check className="h-3 w-3" /> Đã copy</> : <><Copy className="h-3 w-3" /> Copy URL</>}
        </Button>

        {confirmDelete ? (
          <div className="flex gap-2 mt-1">
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setConfirmDelete(false)}>Hủy</Button>
            <Button size="sm" variant="destructive" className="flex-1 text-xs" disabled={deleting} onClick={handleDelete}>
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Xóa'}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="w-full text-red-500 hover:text-red-700 text-xs"
            onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Xóa
          </Button>
        )}
      </div>
    </div>
  );
}
