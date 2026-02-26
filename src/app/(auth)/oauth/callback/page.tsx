'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, AuthenticationResponse } from '@/types/auth.types';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  // Prevent double-execution in React Strict Mode
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const code = searchParams.get('code');

    if (!code) {
      router.replace('/login');
      return;
    }

    const handleOAuthCallback = async () => {
      try {
        const response = await apiClient.post<ApiResponse<AuthenticationResponse>>(
          `/auth/outbound/authentication?code=${encodeURIComponent(code)}`
        );

        if (!response.result) {
          throw new Error('Không nhận được token từ server');
        }

        const { token, expiryTime } = response.result;
        await setAuth(token, expiryTime);
        router.replace('/');
      } catch {
        router.replace('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Đang xác thực tài khoản...</p>
    </div>
  );
}
