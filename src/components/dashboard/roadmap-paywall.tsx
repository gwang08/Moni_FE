'use client';

import { useRouter } from 'next/navigation';
import { Lock, CalendarCheck, Target, Brain, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: CalendarCheck,
    title: 'Lộ trình học từng tuần',
    desc: 'Hệ thống tự động lên kế hoạch học tập hàng tuần, phù hợp với trình độ và mục tiêu của bạn',
  },
  {
    icon: Target,
    title: 'Tập trung vào điểm yếu',
    desc: 'Bài tập được cá nhân hóa, ưu tiên rèn luyện các dạng bạn còn yếu',
  },
  {
    icon: Brain,
    title: 'Phân tích AI thông minh',
    desc: 'Theo dõi mastery & confidence từng chủ đề, điều chỉnh độ khó tự động',
  },
  {
    icon: Award,
    title: 'Đánh giá tháng toàn diện',
    desc: 'Bài test tổng hợp cuối tháng để đo lường tiến bộ thực sự',
  },
];

export function RoadmapPaywall() {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      {/* Blurred preview background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="grid grid-cols-7 gap-2 p-8">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-400" />
          ))}
        </div>
      </div>

      <div className="relative px-6 py-12 md:px-12">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Mở khóa Lộ Trình Học Cá Nhân
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Đăng ký Gói Lộ Trình để được AI lên kế hoạch học tập riêng,
            tối ưu hóa thời gian ôn luyện và đạt mục tiêu IELTS nhanh hơn
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex gap-3 p-4 rounded-xl bg-white/80 border border-gray-100"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-800">{f.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={() => router.push('/payment')}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 text-base font-semibold shadow-lg shadow-indigo-200"
          >
            Xem Gói Lộ Trình
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-xs text-gray-400 mt-3">
            Tối ưu thời gian học, tập trung đúng điểm yếu
          </p>
        </div>
      </div>
    </div>
  );
}
