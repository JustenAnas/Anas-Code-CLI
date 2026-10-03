import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import StatsSection from "@/components/stats-section";
import DownloadAnas from "@/components/download-anas";
import ScrollStatement from "@/components/scroll-statement";
import FeaturesSection from "@/components/features-section";

export default function Home() {
  return (
    <main className="min-h-screen text-white">
      <Navbar />
      <HeroSection />
      <DownloadAnas />
      <StatsSection />
      <ScrollStatement />
      <FeaturesSection />
    </main>
  );
}
