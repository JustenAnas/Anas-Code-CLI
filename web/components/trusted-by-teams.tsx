"use client";

const rowOne = [
  "NORTHSTAR",
  "PIXEL LABS",
  "STACKFORM",
  "ORBIT",
  "MONO",
  "BUILDCO",
  "CRAFT",
];

const rowTwo = [
  "VOID SYSTEMS",
  "FRAME",
  "LUMA",
  "KINETIC",
  "VECTOR",
  "FUSE",
  "NEXUS",
];

function MarqueeRow({
  items,
  reverse = false,
}: {
  items: string[];
  reverse?: boolean;
}) {
  const repeatedItems = [...items, ...items];

  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex w-max items-center gap-16 ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        }`}
      >
        {repeatedItems.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="whitespace-nowrap text-2xl font-semibold tracking-[-0.03em] text-black/25 transition-colors duration-300 hover:text-black md:text-3xl"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrustedByTeams() {
  return (
    <section className="relative z-10 bg-white px-6 py-32 text-black">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="max-w-4xl">
          <p className="text-base font-semibold uppercase tracking-[0.25em] text-black/50">
            Trusted by teams
          </p>

          <h2 className="mt-8 text-6xl font-bold leading-[0.9] tracking-[-0.06em] md:text-8xl lg:text-[8rem]">
            Built for people
            <br />
            <span className="text-black/30">who ship.</span>
          </h2>

          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-black/50 md:text-xl">
            From first idea to production, ANAS is built for developers who
            want to spend less time fighting their tools and more time
            building.
          </p>
        </div>

        {/* Marquees */}
        <div className="mt-28 space-y-8">
          <MarqueeRow items={rowOne} />
          <MarqueeRow items={rowTwo} reverse />
        </div>

        {/* Divider */}
        <hr className="mt-28 border-0 border-t border-black/20" />
      </div>
    </section>
  );
}