'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/user-store';
import { useTourStore } from '@/store/tour-store';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import { Pencil, Check, X, ArrowRight, CalendarDays, Flame, Target as TargetIcon } from 'lucide-react';
import { ChibiMascot } from '@/components/ui/chibi-mascot';

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
  if (!dateStr) return 'Chưa đặt';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function ExamCountdown() {
  const examDate = useUserStore((s) => s.examDate);
  const setExamDate = useUserStore((s) => s.setExamDate);
  const { step: tourStep, nextStep } = useTourStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const activeDate = editing ? (draft || null) : examDate;
  useEffect(() => {
    setDaysRemaining(getDaysRemaining(activeDate));
  }, [activeDate, editing]);

  const startEdit = () => { setDraft(examDate ?? ''); setEditing(true); };

  const saveEdit = () => {
    setExamDate(draft || null);
    setEditing(false);
    if (draft) {
      apiClient.put<ApiResponse<unknown>>('/users/me', { examDate: draft }, true).catch(() => {});
    }
    if (tourStep === 2) nextStep();
  };

  const cancelEdit = () => setEditing(false);

  // Derived totals for warm hero display
  const weeks = daysRemaining !== null ? Math.floor(daysRemaining / 7) : null;
  const hours = daysRemaining !== null ? daysRemaining * 24 : null;

  return (
    <div
      id="exam-countdown-section"
      className={`relative h-full transition-all duration-300 ${
        tourStep === 2 ? 'z-50 ring-4 ring-emerald-400 shadow-2xl rounded-3xl' : 'rounded-3xl shadow-lg shadow-emerald-500/20'
      }`}
    >
      {tourStep === 2 && (
        <div className="absolute top-1/2 -translate-y-1/2 -left-6 -translate-x-full w-64 bg-white p-4 rounded-2xl shadow-xl border border-emerald-100 z-50 animate-in fade-in slide-in-from-right-4">
          <div className="flex gap-3 mb-2">
            <ChibiMascot mood="thinking" size={40} />
            <div className="font-bold text-gray-800 text-sm">Bước 2/3</div>
          </div>
          <p className="text-sm text-gray-600 mb-3">Hãy cập nhật Ngày thi dự kiến của bạn (nếu có). Bạn hoàn toàn có thể bỏ qua bước này!</p>
          <button
            onClick={nextStep}
            className="w-full flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            Bỏ qua bước này
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Gradient hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-6 h-full text-white">
        {/* Decorative blurs */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-emerald-300/20 blur-2xl pointer-events-none"></div>

        <div className="relative flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">
            <CalendarDays className="w-3.5 h-3.5" />
            Lịch thi IELTS
          </span>
          {!editing ? (
            <button
              onClick={startEdit}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Chỉnh sửa ngày thi"
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex gap-1">
              <button onClick={saveEdit} className="p-2 rounded-full hover:bg-white/20">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          {daysRemaining !== null ? (
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-6xl font-extrabold tracking-tight leading-none">{daysRemaining}</span>
              <span className="text-lg opacity-90">ngày còn lại</span>
            </div>
          ) : (
            <div className="text-3xl font-extrabold mb-1 opacity-90">Chưa đặt ngày thi</div>
          )}

          {editing ? (
            <input
              type="date"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-2 text-sm font-bold text-gray-800 bg-white rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-white"
            />
          ) : (
            <p className="text-sm opacity-90 mb-5">Ngày dự thi: <b>{formatDisplayDate(examDate)}</b></p>
          )}

          {daysRemaining !== null && !editing && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-white/15 backdrop-blur rounded-2xl p-3 text-center">
                <div className="text-xl font-extrabold">{weeks}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Tuần</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl p-3 text-center">
                <div className="text-xl font-extrabold">{daysRemaining}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Ngày</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl p-3 text-center">
                <div className="text-xl font-extrabold">{hours?.toLocaleString('vi-VN')}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Giờ</div>
              </div>
            </div>
          )}

          {daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0 && !editing && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold bg-white text-emerald-700 rounded-2xl py-2 px-4">
              <Flame className="w-4 h-4" />
              Sắp đến ngày thi rồi! Cố lên nào!
            </div>
          )}
          {daysRemaining === 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold bg-white text-red-600 rounded-2xl py-2 px-4">
              <TargetIcon className="w-4 h-4" />
              Hôm nay là ngày thi!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
