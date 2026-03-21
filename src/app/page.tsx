'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import {
  Navbar,
  HeroSection,
  ProgramsIntroSection,
  FeaturesSection,
  HowItWorksSection,
  ProgramBanner,
  Footer,
} from "@/components/landing";

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      const role = user?.role;
      const dest = role === 'ADMIN' ? '/admin' : role === 'EXPERT' ? '/expert/dashboard' : '/dashboard';
      router.replace(dest);
    }
  }, [hydrated, isAuthenticated, router]);

  // Show nothing while checking auth
  if (!hydrated) return null;
  // Redirect in progress
  if (isAuthenticated) return null;

  return (
    <>
      <Navbar />
      <HeroSection />
      <ProgramsIntroSection />
      <ProgramBanner
        image="/Moni1.png"
        alt="Moni Preschool - Học bổng lên đến 50 triệu"
        label="Học bổng"
        title="Moni Preschool"
        description="Tặng học bổng lên đến 50 triệu đồng kèm học thử miễn phí. Sẵn sàng khám phá thế giới cùng con!"
        ctaText="Đăng ký ngay"
        ctaHref="/register"
        overlay="left"
      />
      <FeaturesSection />
      <ProgramBanner
        image="/Moni2.png"
        alt="Moni Du học - 30+ quốc gia, 20+ năm kinh nghiệm"
        label="Du học"
        title="Điểm đến tiếp theo của bạn là đâu?"
        description="30+ quốc gia · 20+ năm kinh nghiệm · Học bổng lên đến 15 tỷ đồng. Moni đồng hành cùng bạn trên hành trình du học."
        ctaText="Tư vấn miễn phí"
        ctaHref="#contact"
        overlay="left"
      />
      <HowItWorksSection />
      <ProgramBanner
        image="/Moni3.png"
        alt="Moni Du học - Tương lai đang gõ cửa"
        label="Tương lai"
        title="Tương lai đang gõ cửa"
        description="Chuyến du học 2026 đang chờ bạn. Đồng hành từ A-Z, từ tư vấn đến visa — Mơ ước và bứt phá!"
        ctaText="Khám phá ngay"
        ctaHref="/register"
        overlay="left"
      />
      <Footer />
    </>
  );
}
