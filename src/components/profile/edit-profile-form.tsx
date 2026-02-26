'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { formatApiError } from '@/lib/error-messages';
import type { ApiResponse, UpdateProfileRequest } from '@/types/auth.types';
import { Loader2 } from 'lucide-react';

export function EditProfileForm() {
  const { user, updateUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const payload: UpdateProfileRequest = {
      fullName: fullName || undefined,
      phoneNumber: phoneNumber || undefined,
      dateOfBirth: dateOfBirth || undefined,
      avatarUrl: avatarUrl || undefined,
    };

    try {
      await apiClient.put<ApiResponse<unknown>>('/users/me', payload, true);
      updateUser({
        fullName: fullName || null,
        phoneNumber: phoneNumber || null,
        dateOfBirth: dateOfBirth || null,
        avatarUrl: avatarUrl || null,
      });
      setSuccess('Cập nhật hồ sơ thành công!');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user?.email || ''}
          disabled
          className="bg-gray-50"
        />
      </div>

      <div>
        <Label htmlFor="fullName">Họ và tên</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nguyễn Văn A"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="phoneNumber">Số điện thoại</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="0901234567"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="dateOfBirth">Ngày sinh</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="avatarUrl">URL ảnh đại diện</Label>
        <Input
          id="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang lưu...
          </>
        ) : (
          'Lưu thay đổi'
        )}
      </Button>
    </form>
  );
}
