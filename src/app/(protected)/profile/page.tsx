'use client';

import { useAuthStore } from '@/store/auth-store';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen p-8">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Hồ sơ của tôi</h1>

        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Họ tên</label>
            <p className="text-lg font-medium">{user?.fullName}</p>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="text-lg">{user?.email}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Tính năng chỉnh sửa hồ sơ sẽ được thêm sau.
          </p>
        </div>
      </div>
    </div>
  );
}
