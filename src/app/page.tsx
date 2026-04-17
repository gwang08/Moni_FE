'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import {
  Navbar,
  HeroSection,
  StudyProgressSection,
  SmartLearningSection,
  WritingExpertSection,
  CambridgeOfficialSection,
  CTASection,
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
      <StudyProgressSection />
      <SmartLearningSection />
      <WritingExpertSection />
      <CambridgeOfficialSection />
      <CTASection />
      <Footer />
    </>
  );
}
