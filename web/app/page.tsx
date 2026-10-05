import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import StatsSection from "@/components/stats-section";
import DownloadAnas from "@/components/download-anas";
import ScrollStatement from "@/components/scroll-statement";
import FeaturesSection from "@/components/features-section";
import GettingStarted from "@/components/getting-started";
import TrustedByTeams from "@/components/trusted-by-teams";
import PricingSection from "@/components/pricing-section";
import ReviewsSection from "@/components/reviews-section";
import FAQSection from "@/components/faq-section";
import MoreInfoSection from "@/components/more-info-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen text-white">
      <Navbar />
      <HeroSection />
      <DownloadAnas />
      <StatsSection />
      <ScrollStatement />
      <FeaturesSection />
      <GettingStarted />
      <TrustedByTeams />
      <PricingSection />
      <ReviewsSection />
      <FAQSection />
      <MoreInfoSection />
      <Footer />
    </main>
  );
}
