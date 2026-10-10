"use client";

import OilShader from "@/components/oil-shader";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For trying ANAS and getting started.",
    features: [
      "Basic AI coding agent",
      "Limited usage",
      "Core tools",
      "Community support",
    ],
    featured: false,
  },
  {
    name: "Builder",
    price: "$19",
    description: "For developers building every day.",
    features: [
      "Everything in Free",
      "More AI usage",
      "Multi-provider access",
      "Priority processing",
    ],
    featured: true,
  },
  {
    name: "Pro",
    price: "$49",
    description: "For serious development workflows.",
    features: [
      "Everything in Builder",
      "Higher usage limits",
      "Advanced agent workflows",
      "Priority support",
    ],
    featured: false,
  },
  {
    name: "Scale",
    price: "$99",
    description: "For teams shipping at higher velocity.",
    features: [
      "Everything in Pro",
      "Team workflows",
      "Higher limits",
      "Early access to features",
    ],
    featured: false,
  },
];

export default function PricingSection() {
  return (
    <section className="relative z-10 overflow-hidden bg-black px-6 py-32 text-white">
      {/* Viscous liquid fills the entire pricing section */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <OilShader />
      </div>

      {/* Pricing content sits inside the viscous liquid */}
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Heading */}
        <div className="max-w-5xl">
          <p className="text-base font-semibold uppercase tracking-[0.25em] text-white/70">
            Pricing
          </p>

          <h2 className="mt-8 text-6xl font-bold leading-[0.9] tracking-[-0.06em] text-white md:text-8xl lg:text-[8rem]">
            Pick your
            <br />
            <span className="text-white/40">way to build.</span>
          </h2>

          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
            Start free, upgrade when you need more power, and keep building with
            ANAS.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mt-24 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex min-h-[500px] flex-col rounded-2xl border p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 ${
                plan.featured
                  ? "border-white/20 bg-black/80 text-white"
                  : "border-white/20 bg-white/95 text-black"
              }`}
            >
              <div>
                <p
                  className={`text-sm font-semibold uppercase tracking-[0.2em] ${
                    plan.featured ? "text-white/50" : "text-black/40"
                  }`}
                >
                  {plan.name}
                </p>

                <div className="mt-8 flex items-end gap-2">
                  <span className="text-5xl font-bold tracking-[-0.05em]">
                    {plan.price}
                  </span>

                  <span
                    className={`mb-1 text-sm ${
                      plan.featured ? "text-white/40" : "text-black/40"
                    }`}
                  >
                    / month
                  </span>
                </div>

                <p
                  className={`mt-6 text-sm leading-relaxed ${
                    plan.featured ? "text-white/50" : "text-black/50"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <div
                className={`my-8 h-px ${
                  plan.featured ? "bg-white/10" : "bg-black/10"
                }`}
              />

              <div className="space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-3 text-sm">
                    <span
                      className={plan.featured ? "text-white" : "text-black"}
                    >
                      ✓
                    </span>

                    <span
                      className={
                        plan.featured ? "text-white/60" : "text-black/60"
                      }
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={`mt-auto w-full rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.03] ${
                  plan.featured ? "bg-white text-black" : "bg-black text-white"
                }`}
              >
                Get started
              </button>
            </div>
          ))}
        </div>

        {/* Divider */}
        <hr className="mt-28 border-0 border-t border-white/20" />
      </div>
    </section>
  );
}
