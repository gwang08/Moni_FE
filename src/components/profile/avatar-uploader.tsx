'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { uploadUserMedia } from '@/lib/user-media-api';

interface Props {
  value: string;
  onChange: (url: string) => void;
  fallbackName?: string;
  disabled?: boolean;
}

const MAX_SIZE_MB = 2;
const ACCEPT = 'image/png,image/jpeg,image/webp';

// Avatar upload: hiển thị ảnh hiện tại + nút "Tải ảnh lên" chọn file, upload lên
// /api/v1/user/media/upload rồi gán URL vào field avatarUrl.
export function AvatarUploader({ value, onChange, fallbackName, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng 1 file
    if (!file) return;

    if (!ACCEPT.split(',').includes(file.type)) {
      toast.error('Chỉ hỗ trợ PNG, JPG hoặc WebP');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Ảnh tối đa ${MAX_SIZE_MB}MB`);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadUserMedia(file);
      onChange(url);
      toast.success('Đã tải ảnh lên');
    } catch {
      toast.error('Tải ảnh thất bại, thử lại nhé');
    } finally {
      setUploading(false);
    }
  };

  const initials = getInitials(fallbackName ?? 'U');

  return (
    <div className="flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
      {/* Preview */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 text-white text-[26px] font-black grid place-items-center shadow-md overflow-hidden">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Avatar" className="h-full w-full object-cover" />
          ) : fallbackName ? (
            initials
          ) : (
            <User className="h-8 w-8" />
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 grid place-items-center">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] font-bold text-slate-500 uppercase tracking-widest">Ảnh đại diện</div>
        <div className="text-[13px] font-bold text-slate-800 mt-0.5">PNG, JPG hoặc WebP · tối đa {MAX_SIZE_MB}MB</div>
        <div className="mt-2 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={pickFile}
            disabled={disabled || uploading}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Camera className="h-3.5 w-3.5" />
            {value ? 'Đổi ảnh' : 'Tải ảnh lên'}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled}
              className="px-3 py-1.5 rounded-lg text-rose-600 text-[12px] font-bold hover:bg-rose-50 inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xoá ảnh
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
