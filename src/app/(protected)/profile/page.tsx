'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { EditProfileForm } from '@/components/profile/edit-profile-form';
import { EditExpertProfileForm } from '@/components/profile/edit-expert-profile-form';
import { ChangePasswordForm } from '@/components/profile/change-password-form';
import { Suspense } from 'react';

type TabKey = 'profile' | 'security';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Thông tin cá nhân' },
  { key: 'security', label: 'Bảo mật' },
];

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get('tab') as TabKey) || 'profile';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const { user } = useAuthStore();
  const isExpert = user?.role === 'EXPERT';

  useEffect(() => {
    // If expert lands here, redirect to the sidebar-enabled version
    if (isExpert) {
      router.replace(`/expert/profile?${searchParams.toString()}`);
      return;
    }

    const tab = searchParams.get('tab') as TabKey;
    if (tab && (tab === 'profile' || tab === 'security')) {
      setActiveTab(tab);
    }
  }, [searchParams, isExpert, router]);

  if (isExpert) return null; // Avoid flicker before redirect

  return (
    <div className="min-h-screen p-8">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">
          {isExpert ? 'Hồ sơ chuyên gia' : 'Hồ sơ của tôi'}
        </h1>

        {/* Tab bar */}
        <div className="flex gap-1 border-b mb-6">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ' +
                (activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground')
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          {activeTab === 'profile' ? (
            isExpert ? <EditExpertProfileForm /> : <EditProfileForm />
          ) : (
            <ChangePasswordForm />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
