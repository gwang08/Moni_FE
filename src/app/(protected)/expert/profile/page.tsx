'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EditExpertProfileForm } from '@/components/profile/edit-expert-profile-form';
import { ChangePasswordForm } from '@/components/profile/change-password-form';

type TabKey = 'profile' | 'security';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Thông tin cá nhân' },
  { key: 'security', label: 'Bảo mật' },
];

function ExpertProfileContent() {
  const searchParams = useSearchParams();
  // We keep the tab logic but only show one tab as requested, or just remove tabs entirely.
  // The user said "bỏ tab bảo mật đi", so we'll just show the profile form.
  
  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Thông tin tài khoản</h1>
          <p className="text-slate-500">Quản lý thông tin hồ sơ chuyên gia của bạn</p>
        </div>

        {/* Tab bar - Only showing Profile now */}
        <div className="flex gap-8 border-b border-slate-200 mb-8">
          <button
            className="pb-4 text-sm font-semibold transition-all relative text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
          >
            Thông tin cá nhân
          </button>
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <EditExpertProfileForm />
        </div>
      </div>
    </div>
  );
}

export default function ExpertProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải hồ sơ...</div>}>
      <ExpertProfileContent />
    </Suspense>
  );
}
