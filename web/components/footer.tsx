"use client";

import { CursorDrivenParticleTypography } from "@/components/ui/cursor-driven-particle-typography";

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Getting Started", href: "#getting-started" },
  { label: "Download", href: "#download" },
];

const resourceLinks = [
  { label: "Documentation", href: "/docs" },
  { label: "FAQ", href: "#faq" },
  { label: "Security", href: "/docs" },
  { label: "Languages", href: "/docs" },
];

const connectLinks = [
  { label: "GitHub", href: "#" },
  { label: "Sign Up", href: "/signup" },
  { label: "Login", href: "/login" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-black px-6 pb-8 pt-32 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Main statement */}
        <div className="border-b border-white/10 pb-24">
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-white/30">
            ANAS CLI / AI CODING AGENT
          </p>

          <h2 className="mt-8 max-w-6xl text-[5rem] font-bold leading-[0.78] tracking-[-0.08em] sm:text-[7rem] md:text-[10rem] lg:text-[12rem]">
            Build
            <br />
            <span className="text-white/25">something.</span>
          </h2>

          <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-lg leading-relaxed text-white/40">
              Your terminal. Your codebase. Your agent. Start building with
              ANAS.
            </p>

            <a
              href="/signup"
              className="group inline-flex w-fit items-center gap-4 rounded-full bg-white px-7 py-4 text-sm font-medium text-black transition-transform duration-300 hover:scale-105"
            >
              Get started
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid gap-16 border-b border-white/10 py-16 md:grid-cols-4">
          <div>
            <p className="text-2xl font-semibold tracking-tight">ANAS</p>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/30">
              A multi-provider AI coding agent built for developers who ship.
            </p>
          </div>

          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-white/25">
              Product
            </p>

            <div className="space-y-3">
              {productLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block w-fit text-sm text-white/50 transition-all duration-300 hover:translate-x-1 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-white/25">
              Resources
            </p>

            <div className="space-y-3">
              {resourceLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block w-fit text-sm text-white/50 transition-all duration-300 hover:translate-x-1 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-white/25">
              Connect
            </p>

            <div className="space-y-3">
              {connectLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block w-fit text-sm text-white/50 transition-all duration-300 hover:translate-x-1 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer metadata */}
        <div className="flex flex-col gap-8 py-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/20">
              Built for developers
            </p>

            <p className="text-sm text-white/30">
              © {new Date().getFullYear()} ANAS. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-white/40 transition-all duration-300 hover:border-white/30 hover:text-white"
            >
              EN / English
            </button>

            <a
              href="/docs"
              className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-white/40 transition-all duration-300 hover:border-white/30 hover:text-white"
            >
              Docs ↗
            </a>

            <a
              href="#"
              className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-white/40 transition-all duration-300 hover:border-white/30 hover:text-white"
            >
              GitHub ↗
            </a>
          </div>
        </div>

        {/* Oversized brand mark */}
        <div className="select-none">
          <div className="flex items-end">
            {/* 70% — ANAS */}
            <div className="w-[70%] shrink-0">
              <p className="whitespace-nowrap text-[25vw] font-bold leading-none tracking-[-0.1em] text-white/[0.035]">
                ANAS
              </p>
            </div>

            {/* 30% — cli */}
            <div className="mb-[1vw] w-[30%] shrink-0">
              <div className="h-[12vw] w-full">
                <CursorDrivenParticleTypography
                  text="cli"
                  fontSize={180}
                  particleSize={2}
                  particleDensity={5}
                  dispersionStrength={15}
                  returnSpeed={0.08}
                  color="rgba(255,255,255,0.9)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}