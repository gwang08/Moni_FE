'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/user-store';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import { Pencil, Check, X, CalendarDays, Clock } from 'lucide-react';

function getDaysRemaining(examDate: string | null): number | null {
  if (!examDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(examDate);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  if (diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return '_ / _ / _';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function ExamCountdown() {
  const examDate = useUserStore((s) => s.examDate);
  const setExamDate = useUserStore((s) => s.setExamDate);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // Live countdown: use draft when editing, store value otherwise
  const activeDate = editing ? (draft || null) : examDate;
  useEffect(() => {
    setDaysRemaining(getDaysRemaining(activeDate));
  }, [activeDate, editing]);

  const startEdit = () => {
    setDraft(examDate ?? '');
    setEditing(true);
  };

  const saveEdit = () => {
    setExamDate(draft || null);
    setEditing(false);
    // Sync to backend (fire & forget)
    if (draft) {
      apiClient.put<ApiResponse<unknown>>('/users/me', { examDate: draft }, true).catch(() => {});
    }
  };

  const cancelEdit = () => setEditing(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-800">Lịch thi</h3>
        {!editing ? (
          <button
            onClick={startEdit}
            className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors"
            title="Chỉnh sửa ngày thi"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={saveEdit} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Date Section */}
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-50 border border-orange-100">
          <div className="p-2 bg-orange-100 rounded-lg">
            <CalendarDays className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-orange-600 font-medium mb-1">Ngày dự thi</p>
            {editing ? (
              <input
                type="date"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="text-sm font-semibold text-gray-800 bg-white border border-orange-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-orange-300"
              />
            ) : (
              <p className="text-lg font-bold text-gray-800">
                {formatDisplayDate(examDate)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-blue-600 font-medium mb-1">Số ngày còn lại</p>
            <p className="text-3xl font-bold text-gray-800">
              {daysRemaining !== null ? (
                <>
                  {daysRemaining}
                  <span className="text-base font-medium text-gray-500 ml-1">ngày</span>
                </>
              ) : (
                <span className="text-lg font-medium text-gray-400">_ ngày</span>
              )}
            </p>
          </div>
        </div>

        {daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0 && (
          <div className="text-center text-sm text-orange-600 font-medium bg-orange-50 rounded-xl py-2 px-4">
            Sắp đến ngày thi rồi! Cố lên nào!
          </div>
        )}
        {daysRemaining === 0 && (
          <div className="text-center text-sm text-rose-600 font-medium bg-rose-50 rounded-xl py-2 px-4">
            Hôm nay là ngày thi!
          </div>
        )}
      </div>
    </div>
  );
}
