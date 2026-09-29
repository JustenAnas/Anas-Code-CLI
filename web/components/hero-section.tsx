import Link from "next/link";
import Lanyard from "@/components/ui/lanyard";
import DecryptedText from "@/components/DecryptedText";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import { transitionVariants } from "@/lib/utils";

export default function HeroSection() {
  return (
    <main className="overflow-x-hidden">
      <section className="lg:h-screen">
        <div className="grid grid-cols-1 grid-rows-2 pb-24 pt-12 md:pb-32 lg:grid-cols-2 lg:grid-rows-1 lg:pb-56 lg:pt-24">
          {/* Left side */}
          <div className="relative mx-auto flex max-w-xl flex-col px-6 lg:block">
            <div className="mx-auto max-w-2xl text-center lg:ml-0 lg:text-left">
              <div className="mt-8 lg:mt-16">
                <DecryptedText
                  text="MULTI-PROVIDER AI CODING AGENT"
                  animateOn="view"
                  revealDirection="start"
                  sequential
                  useOriginalCharsOnly={false}
                  speed={70}
                  className="rounded-md bg-black font-mono uppercase text-white/60"
                />
              </div>

              <TextEffect
                preset="fade-in-blur"
                speedSegment={0.3}
                as="h1"
                className="max-w-2xl text-balance text-6xl font-semibold md:text-7xl xl:text-8xl"
              >
                Code to
              </TextEffect>

              <TextEffect
                preset="fade-in-blur"
                speedSegment={0.3}
                as="h1"
                className="max-w-2xl text-balance text-6xl font-semibold md:text-7xl xl:text-8xl"
              >
                Production.
              </TextEffect>

              <TextEffect
                per="line"
                preset="fade-in-blur"
                speedSegment={0.3}
                delay={0.5}
                as="p"
                className="mt-8 max-w-2xl text-pretty text-lg text-white/60"
              >
                ANAS is an AI coding agent that understands your codebase, edits
                files, runs commands, and helps you ship without constantly
                switching between tools.
              </TextEffect>

              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.75,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
                className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start"
              >
                <Link
                  href="/signup"
                  className="rounded-full bg-white px-6 py-3 text-base font-medium text-black transition hover:bg-white/90"
                >
                  Get Started
                </Link>

                <Link
                  href="#features"
                  className="rounded-full bg-black/30 px-6 py-3 text-base text-white backdrop-blur-sm transition hover:bg-white/10"
                >
                  Explore ANAS
                </Link>
              </AnimatedGroup>
            </div>
          </div>

          {/* Right side */}
          <div className="relative h-[700px] w-full lg:h-screen">
            <Lanyard />
          </div>
        </div>
      </section>
    </main>
  );
}
