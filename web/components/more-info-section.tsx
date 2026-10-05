"use client";

const documentationLinks = [
  "Installation guide",
  "macOS",
  "Windows",
  "Linux",
  "CLI commands",
  "Configuration",
];

const resourceLinks = [
  { label: "Pricing", href: "#pricing" },
  { label: "Languages", href: "/docs" },
  { label: "Security", href: "/docs" },
  { label: "Getting started", href: "#getting-started" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export default function MoreInfoSection() {
  return (
    <section
      id="more-info"
      className="relative z-10 bg-white px-6 py-32 text-black"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-base font-semibold uppercase tracking-[0.25em] text-black/40">
            More info
          </p>

          <h2 className="mt-8 text-6xl font-bold leading-[0.9] tracking-[-0.06em] md:text-8xl lg:text-[8rem]">
            Everything
            <br />
            <span className="text-black/30">in one place.</span>
          </h2>

          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-black/50 md:text-xl">
            Explore the documentation, learn how ANAS works, and find
            everything you need to get started.
          </p>
        </div>

        <div className="mt-24 grid gap-6 lg:grid-cols-2">
          {/* Documentation */}
          <div className="group rounded-3xl border border-black/10 p-8 transition-colors duration-500 hover:border-yellow-400 md:p-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-mono text-sm text-black/30">01</p>

                <h3 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
                  Documentation
                </h3>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 text-xl transition-all duration-300 group-hover:border-yellow-400 group-hover:bg-yellow-400">
                ↗
              </div>
            </div>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-black/50">
              Learn how to install ANAS, configure your provider, and get your
              coding agent running.
            </p>

            <div className="mt-10 border-t border-black/10 pt-6">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-black/30">
                Explore docs
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {documentationLinks.map((link) => (
                  <a
                    key={link}
                    href="/docs"
                    className="flex items-center justify-between rounded-xl border border-black/5 px-4 py-3 text-sm text-black/70 transition-all duration-300 hover:border-black/15 hover:bg-black hover:text-white"
                  >
                    <span>{link}</span>
                    <span>→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="group rounded-3xl border border-black/10 p-8 transition-colors duration-500 hover:border-purple-500 md:p-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-mono text-sm text-black/30">02</p>

                <h3 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
                  Explore ANAS
                </h3>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 text-xl transition-all duration-300 group-hover:border-purple-500 group-hover:bg-purple-500 group-hover:text-white">
                ↗
              </div>
            </div>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-black/50">
              Jump straight to the parts of ANAS you want to explore, from
              pricing and features to security and getting started.
            </p>

            <div className="mt-10 border-t border-black/10 pt-6">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-black/30">
                Quick links
              </p>

              <div className="space-y-3">
                {resourceLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between border-b border-black/10 py-3 text-lg transition-all duration-300 hover:translate-x-2"
                  >
                    <span>{link.label}</span>
                    <span className="text-black/30 transition-colors duration-300 group-hover:text-black">
                      →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <hr className="mt-28 border-0 border-t border-black/20" />
      </div>
    </section>
  );
}