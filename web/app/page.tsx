import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import StatsSection from "@/components/stats-section";
import CallToAction from "@/components/call-to-action";
import DownloadAnas from "@/components/download-anas";

export default function Home() {
  return (
    <main className="min-h-screen text-white">
      <Navbar />
      <HeroSection />
      <DownloadAnas />
      <StatsSection />
      <CallToAction />
    </main>
  );
}
