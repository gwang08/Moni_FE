'use client';

import { useRouter } from 'next/navigation';
import { CalendarCheck, Target, Brain, Award, ArrowRight, Sparkles, X } from 'lucide-react';
import { ChibiMascot } from '@/components/ui/chibi-mascot';
import { useTourStore } from '@/store/tour-store';
import { usePaymentStore } from '@/store/payment-store';
import type { ChibiMood } from '@/components/ui/chibi-mascot';

const FEATURE_HIGHLIGHT_DONE_KEY = 'featureHighlightTourDone';

export function markFeatureHighlightDone() {
  localStorage.setItem(FEATURE_HIGHLIGHT_DONE_KEY, '1');
}

export function hasSeenFeatureHighlight(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(FEATURE_HIGHLIGHT_DONE_KEY) === '1';
}

interface Slide {
  icon: typeof CalendarCheck;
  iconGradient: string;
  mood: ChibiMood;
  title: string;
  subtitle: string;
  description: string;
  highlight?: string;
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    iconGradient: 'from-violet-500 to-indigo-600',
    mood: 'excited',
    title: 'Lộ trình học cá nhân hóa bằng AI',
    subtitle: 'Dành riêng cho bạn',
    description: 'Hệ thống AI phân tích trình độ hiện tại, mục tiêu IELTS và thời gian ôn luyện để tạo ra lộ trình học tập hoàn toàn riêng biệt cho bạn.',
    highlight: 'Không có 2 lộ trình nào giống nhau!',
  },
  {
    icon: CalendarCheck,
    iconGradient: 'from-emerald-500 to-teal-600',
    mood: 'happy',
    title: 'Weekly Plan thông minh',
    subtitle: 'Kế hoạch từng tuần',
    description: 'Mỗi tuần, AI sẽ tự động lên kế hoạch bài tập cho 4 kỹ năng: Reading, Listening, Writing, Speaking và cả Vocabulary.',
    highlight: 'Chỉ cần mở ra và làm theo!',
  },
  {
    icon: Target,
    iconGradient: 'from-blue-500 to-cyan-600',
    mood: 'thinking',
    title: 'Tập trung vào điểm yếu',
    subtitle: 'Học đúng - Học trúng',
    description: 'AI theo dõi mastery & confidence từng chủ đề, tự động ưu tiên rèn luyện những phần bạn còn yếu và điều chỉnh độ khó phù hợp.',
    highlight: 'Tiết kiệm thời gian, tối đa hiệu quả!',
  },
  {
    icon: Award,
    iconGradient: 'from-amber-500 to-orange-600',
    mood: 'excited',
    title: 'Đánh giá định kỳ',
    subtitle: 'Đo lường tiến bộ thực sự',
    description: 'Cuối mỗi tuần có bài Weekly Assessment để điều chỉnh độ khó. Đầu mỗi tháng có Monthly Test để rà soát sự tiến bộ dài hạn.',
    highlight: 'Luôn biết mình đang ở đâu!',
  },
];

export function FeatureHighlightTour() {
  const router = useRouter();
  const { step, nextStep, stopTour } = useTourStore();
  const setReturnUrl = usePaymentStore((s) => s.setReturnUrl);

  const isLastSlide = step > SLIDES.length;
  const currentSlide = SLIDES[step - 1];

  const handleSkip = () => {
    markFeatureHighlightDone();
    stopTour();
  };

  const handleBuy = () => {
    markFeatureHighlightDone();
    setReturnUrl('/dashboard?startSetupTour=true');
    sessionStorage.setItem('payment-return-url', '/dashboard?startSetupTour=true');
    stopTour();
    router.push('/payment');
  };

  // CTA slide (last)
  if (isLastSlide) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl" />

        <button
          onClick={handleSkip}
          className="absolute top-5 right-5 z-10 p-2 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center text-center">
            <ChibiMascot mood="excited" size={140} />

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 mb-3">
              Sẵn sàng chinh phục IELTS?
            </h2>
            <p className="text-white/70 text-base sm:text-lg mb-2 max-w-sm leading-relaxed">
              Mua gói Lộ Trình để trải nghiệm hệ thống ôn luyện IELTS hiện đại nhất
            </p>
            <p className="text-emerald-400/80 text-sm mb-8 font-medium">
              AI lên kế hoạch riêng, bám sát mục tiêu, tối ưu thời gian
            </p>

            <button
              onClick={handleBuy}
              className="w-full max-w-xs h-13 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-base shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              Mua gói Lộ Trình
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleSkip}
              className="mt-4 text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              Để sau
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-white/20" />
          ))}
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
      </div>
    );
  }

  if (!currentSlide) return null;

  const Icon = currentSlide.icon;
  const slideIndex = step - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      {/* Decorative orbs */}
      <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl" />

      <button
        onClick={handleSkip}
        className="absolute top-5 right-5 z-10 p-2 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-500" key={step}>
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${currentSlide.iconGradient} flex items-center justify-center shadow-lg mb-6`}>
            <Icon className="w-10 h-10 text-white" />
          </div>

          {/* Mascot */}
          <ChibiMascot mood={currentSlide.mood} size={100} />

          {/* Content */}
          <div className="mt-5">
            <p className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-2">
              {currentSlide.subtitle}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
              {currentSlide.title}
            </h2>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed max-w-sm mx-auto mb-3">
              {currentSlide.description}
            </p>
            {currentSlide.highlight && (
              <p className="text-emerald-400 text-sm font-semibold">
                {currentSlide.highlight}
              </p>
            )}
          </div>

          {/* Next button */}
          <button
            onClick={nextStep}
            className="mt-8 w-full max-w-xs h-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2"
          >
            Tiếp theo
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === slideIndex ? 'bg-white w-6' : i < slideIndex ? 'bg-white/50' : 'bg-white/20'
            }`}
          />
        ))}
        <div className="w-2 h-2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}
