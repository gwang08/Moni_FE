import {
  Navbar,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  ContentSection,
  CTASection,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ContentSection />
      <CTASection />
      <Footer />
    </>
  );
}
