'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { formatApiError } from '@/lib/error-messages';
import type { ApiResponse, RegisterRequest, UserProfileResponse } from '@/types/auth.types';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dateOfBirth: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = (): string | null => {
    if (formData.password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/.test(formData.password))
      return 'Mật khẩu phải bao gồm chữ hoa, chữ thường và số';
    if (formData.password !== formData.confirmPassword) return 'Mật khẩu xác nhận không khớp';
    if (new Date(formData.dateOfBirth) >= new Date()) return 'Ngày sinh phải trong quá khứ';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterRequest = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber || undefined,
      };
      await apiClient.post<ApiResponse<UserProfileResponse>>('/credentials/register', payload);
      router.push('/login?registered=true');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-2xl font-bold text-center mb-2">Đăng ký</h2>

      <Input
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        placeholder="Họ và tên"
        required
        disabled={loading}
        className="h-10 rounded-lg"
      />

      <Input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        required
        disabled={loading}
        className="h-10 rounded-lg"
      />

      <Input
        name="dateOfBirth"
        type="date"
        value={formData.dateOfBirth}
        onChange={handleChange}
        required
        disabled={loading}
        max={new Date().toISOString().split('T')[0]}
        className="h-10 rounded-lg"
      />

      <Input
        name="phoneNumber"
        type="tel"
        value={formData.phoneNumber}
        onChange={handleChange}
        placeholder="Số điện thoại (tùy chọn)"
        disabled={loading}
        className="h-10 rounded-lg"
      />

      <div className="relative">
        <Input
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          placeholder="Mật khẩu"
          required
          disabled={loading}
          className="h-10 rounded-lg pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground !-mt-1">Ít nhất 8 ký tự, chữ hoa, thường và số</p>

      <div className="relative">
        <Input
          name="confirmPassword"
          type={showConfirm ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Xác nhận mật khẩu"
          required
          disabled={loading}
          className="h-10 rounded-lg pr-10"
        />
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-10 rounded-lg font-semibold tracking-wide"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang đăng ký...
          </>
        ) : (
          'ĐĂNG KÝ'
        )}
      </Button>
    </form>
  );
}
