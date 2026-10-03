"use client";

const features = [
  {
    number: "01",
    title: "Understand Your Codebase",
    description:
      "ANAS explores your project, understands the structure, and helps you work with your code without constantly explaining every file.",
  },
  {
    number: "02",
    title: "Build With Your Agent",
    description:
      "Give ANAS a task and let it inspect files, make changes, run commands, and work through the problem with you.",
  },
  {
    number: "03",
    title: "Edit Files With Confidence",
    description:
      "ANAS can read existing code, make targeted changes, and keep your project structure intact while you stay in control.",
  },
  {
    number: "04",
    title: "Ship Faster",
    description:
      "From the first idea to the final command, ANAS helps turn your coding workflow into a faster and more focused experience.",
  },
];

function FeatureVisual({ number }: { number: string }) {
  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-black/10 bg-black">
      <img
        src="/hero-preview.png"
        alt={`ANAS CLI feature ${number}`}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-black/0" />

      <div className="absolute bottom-5 left-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform duration-300 group-hover:scale-110">
        <span className="ml-0.5 text-sm">▶</span>
      </div>

      <div className="absolute right-5 top-5 rounded-full bg-black/70 px-3 py-1.5 font-mono text-xs text-white backdrop-blur-sm">
        FEATURE {number}
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative z-10 bg-white px-6 py-32 text-black"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-32 max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-black/40">
            Features
          </p>

          <h2 className="mt-8 max-w-5xl text-6xl font-bold leading-[0.9] tracking-[-0.06em] md:text-8xl lg:text-[9rem]">
            Stop paying for
            <br />
            every little thing.
            <br />
            <span className="text-black/30">Meet ANAS CLI.</span>
          </h2>

          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-black/50 md:text-xl">
            ANAS gives you an AI coding agent that understands your codebase,
            works with your files, and helps you move from idea to production.
          </p>
        </div>

        <div className="space-y-32">
          {features.map((feature, index) => {
            const textFirst = index % 2 === 0;

            return (
              <div
                key={feature.number}
                className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20"
              >
                {textFirst ? (
                  <>
                    <div className="max-w-xl">
                      <p className="font-mono text-sm text-black/30">
                        {feature.number}
                      </p>

                      <h3 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
                        {feature.title}
                      </h3>

                      <p className="mt-6 text-lg leading-relaxed text-black/50">
                        {feature.description}
                      </p>
                    </div>

                    <FeatureVisual number={feature.number} />
                  </>
                ) : (
                  <>
                    <FeatureVisual number={feature.number} />

                    <div className="max-w-xl lg:ml-auto">
                      <p className="font-mono text-sm text-black/30">
                        {feature.number}
                      </p>

                      <h3 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
                        {feature.title}
                      </h3>

                      <p className="mt-6 text-lg leading-relaxed text-black/50">
                        {feature.description}
                      </p>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-32 flex justify-center gap-3">
          <a
            href="/docs"
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-transform duration-300 hover:scale-110"
          >
            Install Guide
          </a>

          <a
            href="/docs"
            className="rounded-full border border-black/10 px-6 py-3 text-sm font-medium text-black transition-all duration-300 hover:scale-110 hover:bg-black hover:text-white"
          >
            User Guide
          </a>
        </div>
      </div>
    </section>
  );
}
