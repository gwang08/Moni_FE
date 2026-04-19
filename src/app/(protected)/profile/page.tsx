'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { EditProfileForm } from '@/components/profile/edit-profile-form';
import { ChangePasswordForm } from '@/components/profile/change-password-form';
import { ProfileSidebar, type ProfileTabKey } from '@/components/profile/profile-sidebar';

function isValidTab(v: string | null): v is ProfileTabKey {
  return v === 'profile' || v === 'security';
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isExpert = user?.role === 'EXPERT';

  const initialTab: ProfileTabKey = isValidTab(searchParams.get('tab')) ? (searchParams.get('tab') as ProfileTabKey) : 'profile';
  const [activeTab, setActiveTab] = useState<ProfileTabKey>(initialTab);

  // Expert redirects tới layout riêng có sidebar app-level
  useEffect(() => {
    if (isExpert) {
      router.replace(`/expert/profile?${searchParams.toString()}`);
    }
  }, [isExpert, router, searchParams]);

  // Sync URL khi đổi tab (giữ deep-link)
  const handleTabChange = (k: ProfileTabKey) => {
    setActiveTab(k);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', k);
    router.replace(`/profile?${params.toString()}`, { scroll: false });
  };

  if (isExpert) return null;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-[26px] md:text-[30px] font-black tracking-tight">Hồ sơ của tôi</h1>
          <p className="text-[13.5px] text-slate-500 font-medium mt-1">
            Cập nhật thông tin và bảo mật tài khoản.
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
            <ProfileSidebar active={activeTab} onChange={handleTabChange} />

            <div className="p-6 md:p-8">
              {activeTab === 'profile' ? <ProfileSection /> : <SecuritySection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-[20px] font-black tracking-tight">Thông tin cá nhân</h2>
        <p className="text-[13px] text-slate-500 font-medium mt-1">
          Cập nhật hồ sơ — Moni sẽ cá nhân hoá lộ trình cho bạn.
        </p>
      </div>
      <EditProfileForm />
    </>
  );
}

function SecuritySection() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-[20px] font-black tracking-tight">Bảo mật</h2>
        <p className="text-[13px] text-slate-500 font-medium mt-1">
          Đổi mật khẩu định kỳ để giữ tài khoản an toàn.
        </p>
      </div>
      <ChangePasswordForm />
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
