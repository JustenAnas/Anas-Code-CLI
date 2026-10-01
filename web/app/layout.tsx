import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Dither from "@/components/Dither";
import SiteShell from "@/components/site-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANAS — AI Coding Agent",
  description: "ANAS is a multi-provider AI coding agent.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="absolute w-full h-dvh max-h-155 sm:max-h-115 md:max-h-125 lg:max-h-190 xl:max-h-195">
          <Dither
            waveColor={[
              0.30980392156862746, 0.30980392156862746, 0.30980392156862746,
            ]}
            disableAnimation={false}
            enableMouseInteraction
            mouseRadius={0.3}
            colorNum={4}
            pixelSize={2}
            waveAmplitude={0.3}
            waveFrequency={3}
            waveSpeed={0.05}
          />
        </div>

        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
