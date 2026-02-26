'use client';

import { useState } from 'react';
import { EditProfileForm } from '@/components/profile/edit-profile-form';
import { ChangePasswordForm } from '@/components/profile/change-password-form';

type TabKey = 'profile' | 'security';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Thông tin cá nhân' },
  { key: 'security', label: 'Bảo mật' },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  return (
    <div className="min-h-screen p-8">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Hồ sơ của tôi</h1>

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
        <div className="bg-white rounded-lg border p-6">
          {activeTab === 'profile' ? <EditProfileForm /> : <ChangePasswordForm />}
        </div>
      </div>
    </div>
  );
}
