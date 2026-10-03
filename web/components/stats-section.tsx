"use client";

const stats = [
  {
    value: "2.4K",
    label: "GitHub Stars",
    icon: "★",
  },
  {
    value: "18.2K",
    label: "Installs",
    icon: "↓",
  },
  {
    value: "4.8B",
    label: "Tokens / Week",
    icon: "⚡",
  },
  {
    value: "∞",
    label: "Singularity",
    icon: "◉",
  },
];

export default function StatsSection() {
  return (
    <section className="relative z-20 min-h-125 px-6 py-24 text-black">
      <hr className="border-black/10" />

      <div className="mx-auto max-w-7xl">
        <p className="py-12 text-center font-mono text-xs uppercase tracking-[0.25em] text-black/40">
          By the numbers
        </p>

        <div className="relative z-20 grid grid-cols-2 border-y border-black/10 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`group flex min-h-52 flex-col justify-between p-8 transition-all duration-300 hover:bg-black/3 ${
                index !== 0 ? "border-l border-black/10" : ""
              }`}
            >
              <div className="text-2xl text-black/40 transition-all duration-300 group-hover:scale-110 group-hover:text-black">
                {stat.icon}
              </div>

              <div>
                <div className="text-4xl font-semibold tracking-tight text-black">
                  {stat.value}
                </div>

                <div className="mt-2 text-sm font-medium text-black/40">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="mt-12 border-black/10" />
    </section>
  );
}
