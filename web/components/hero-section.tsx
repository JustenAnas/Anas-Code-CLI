"use client";

import Link from "next/link";
import Lanyard from "@/components/ui/lanyard";
import DecryptedText from "@/components/DecryptedText";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import { transitionVariants } from "@/lib/utils";
import Dither from "@/components/Dither";

export default function HeroSection() {
  return (
    <main className="overflow-x-hidden">
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
      <section className="lg:h-screen">
        <div className="grid grid-cols-1 grid-rows-2 pb-24 pt-12 md:pb-32 lg:grid-cols-2 lg:grid-rows-1 lg:pb-56 lg:pt-24">
          {/* Left side */}
          <div className="relative mx-auto flex max-w-xl flex-col px-6 lg:-mt-12 lg:block">
            <div className="mx-auto max-w-2xl text-center lg:ml-0 lg:text-left">
              <div className="mt-8 lg:mt-16">
                <DecryptedText
                  text="MULTI-PROVIDER AI CODING AGENT"
                  animateOn="view"
                  revealDirection="start"
                  sequential
                  useOriginalCharsOnly={false}
                  speed={55}
                  className="rounded-md bg-black font-mono uppercase text-white/60"
                />
              </div>

              <TextEffect
                preset="fade-in-blur"
                speedSegment={0.4}
                delay={0.25}
                as="h1"
                className="max-w-2xl text-balance text-6xl font-semibold md:text-7xl xl:text-8xl"
              >
                Code to
              </TextEffect>

              <TextEffect
                preset="fade-in-blur"
                speedSegment={0.4}
                delay={0.45}
                as="h1"
                className="max-w-2xl text-balance text-6xl font-semibold md:text-7xl xl:text-8xl"
              >
                Production.
              </TextEffect>

              <TextEffect
                per="line"
                preset="fade-in-blur"
                speedSegment={0.35}
                delay={0.7}
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
                        staggerChildren: 0.12,
                        delayChildren: 1.05,
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
                  Sign Up
                </Link>

                <Link
                  href="/docs"
                  className="rounded-full bg-black/30 px-6 py-3 text-base text-white backdrop-blur-sm transition hover:bg-white/10"
                >
                  Documents
                </Link>
              </AnimatedGroup>
            </div>
          </div>

          {/* Right side */}
          <div className="relative flex w-full flex-col items-center lg:-mt-12">
            <div className="relative w-[96%] max-w-4xl">
              <img
                src="/hero-preview.png"
                alt="ANAS CLI preview"
                className="h-110 w-full rounded-2xl border border-white/10 object-cover"
              />
              {/* card */}
              <div className="pointer-events-auto absolute inset-0 z-10">
                <Lanyard
                  position={[0, 0, 20]}
                  containerClassName="relative h-screen w-full select-none"
                />
              </div>
            </div>

            <div className="relative z-20 mt-16 w-[96%] max-w-4xl">
              <p className="mb-4 text-2xl font-medium text-white">
                Be the first to know when we launch or update our product.
              </p>

              <div className="flex items-center gap-3">
                <input
                  type="email"
                  placeholder="Mail"
                  className="h-12 flex-1 rounded-full border border-white/10 bg-black/40 px-5 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
                />

                <button
                  type="button"
                  className="h-12 rounded-full bg-white px-6 text-sm font-medium text-black transition-all duration-300 hover:scale-105 hover:bg-white/80"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
