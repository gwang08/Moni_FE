'use client';

import { useRef, useState, useEffect } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { uploadMedia } from '@/lib/admin-api';

interface Props {
  /** Called with the uploaded URL (immediate upload mode) */
  onUploaded: (url: string) => void;
  /** When provided, file is NOT uploaded immediately. Parent receives file + preview URL. */
  onFileSelected?: (file: File, previewUrl: string) => void;
  /** Custom button text */
  label?: React.ReactNode;
  /** Custom subtext */
  sublabel?: React.ReactNode;
  /** Hide the upload icon (default: false) */
  hideIcon?: boolean;
  /** Custom icon component */
  icon?: React.ReactNode;
  /** Custom class for the outer container */
  className?: string;
}

export function MediaUploadZone({ onUploaded, onFileSelected, label, sublabel, hideIcon, icon, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleFile = async (file: File) => {
    setError('');

    // Deferred mode: preview only, no upload
    if (onFileSelected) {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const previewUrl = URL.createObjectURL(file);
      previewUrlRef.current = previewUrl;
      onFileSelected(file, previewUrl);
      return;
    }

    // Immediate upload mode
    setUploading(true);
    try {
      const url = await uploadMedia(file);
      onUploaded(url);
    } catch {
      setError('Tải lên thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${
        dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
      } ${className}`}
    >
      <input ref={inputRef} type="file" className="hidden" onChange={onFileChange} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Đang tải lên...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {!hideIcon && (icon || <Upload className="h-8 w-8 text-gray-400" />)}
          <p className="text-sm font-medium text-gray-600">{label || 'Kéo thả file hoặc nhấn để chọn'}</p>
          {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
          {sublabel === undefined && <p className="text-xs text-gray-400">Hỗ trợ ảnh, video, audio và tài liệu</p>}
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
