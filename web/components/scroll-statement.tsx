"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const words = [
  "Paying",
  "Money",
  "To",
  "Coding",
  "Agent",
  "Sucks",
  "You",
  "Know",
  "Who Else",
  "Sucks",
  "Your",
];

export default function ScrollStatement() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordRefs = useRef<(HTMLDivElement | null)[]>([]);
  const momRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moneyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const ctx = gsap.context(() => {
      const elements = wordRefs.current.filter(
        (element): element is HTMLDivElement => element !== null,
      );

      const mom = momRefs.current.filter(
        (element): element is HTMLDivElement => element !== null,
      );

      const money = moneyRef.current;

      if (!money || mom.length !== 3) return;

      const startY = () => window.innerHeight;
      const exitY = () => -window.innerHeight;

      gsap.set(elements, {
        y: startY,
        opacity: 0,
      });

      gsap.set(elements[0], {
        y: 0,
        opacity: 1,
      });

      gsap.set(mom, {
        y: startY,
        opacity: 0,
      });

      gsap.set(money, {
        y: startY,
        opacity: 0,
      });

      const tl = gsap.timeline({
        defaults: {
          ease: "power2.out",
        },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=7000",
          pin: true,
          scrub: 0.4,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (self.direction === -1) {
              gsap.set(mom, {
                opacity: 0,
              });
            }
          },
        },
      });

      // NORMAL WORDS
      elements.forEach((current, index) => {
        if (index === 0) return;

        const previous = elements[index - 1];

        tl.to(previous, {
          y: exitY,
          opacity: 0,
          duration: 0.75,
        }).to(
          current,
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
          },
          "<",
        );

        tl.to({}, { duration: 0.25 });
      });

      // YOUR → M
      tl.to(elements[elements.length - 1], {
        y: exitY,
        opacity: 0,
        duration: 0.45,
      });

      tl.to(
        mom[0],
        {
          y: 0,
          opacity: 1,
          duration: 0.06,
        },
        "<",
      );

      // M → O
      tl.to(mom[0], {
        y: exitY,
        opacity: 0,
        duration: 0.035,
      }).to(
        mom[1],
        {
          y: 0,
          opacity: 1,
          duration: 0.035,
        },
        "<",
      );

      // O → M
      tl.to(mom[1], {
        y: exitY,
        opacity: 0,
        duration: 0.08,
      }).to(
        mom[2],
        {
          y: 0,
          opacity: 1,
          duration: 0.08,
        },
        "<",
      );

      // M → MONEY
      tl.to(mom[2], {
        y: exitY,
        opacity: 0,
        duration: 0.08,
      }).to(
        money,
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
        },
        "<",
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen overflow-hidden bg-white text-black"
    >
      <div className="relative flex h-screen items-center justify-center">
        {words.map((word, index) => (
          <div
            key={`${word}-${index}`}
            ref={(element) => {
              wordRefs.current[index] = element;
            }}
            className="absolute inset-0 flex items-center justify-center px-6 text-center text-[clamp(4rem,12vw,11rem)] font-semibold leading-none tracking-[-0.06em]"
          >
            {word}
          </div>
        ))}

        {/* M */}
        <div
          ref={(element) => {
            momRefs.current[0] = element;
          }}
          className="absolute inset-0 flex items-center justify-center text-[clamp(4rem,12vw,11rem)] font-semibold leading-none tracking-[-0.06em]"
        >
          M
        </div>

        {/* O */}
        <div
          ref={(element) => {
            momRefs.current[1] = element;
          }}
          className="absolute inset-0 flex items-center justify-center text-[clamp(4rem,12vw,11rem)] font-semibold leading-none tracking-[-0.06em]"
        >
          O
        </div>

        {/* M */}
        <div
          ref={(element) => {
            momRefs.current[2] = element;
          }}
          className="absolute inset-0 flex items-center justify-center text-[clamp(4rem,12vw,11rem)] font-semibold leading-none tracking-[-0.06em]"
        >
          M
        </div>

        {/* Money */}
        <div
          ref={moneyRef}
          className="absolute inset-0 flex items-center justify-center px-6 text-center text-[clamp(4rem,12vw,11rem)] font-semibold leading-none tracking-[-0.06em]"
        >
          Money
        </div>
      </div>
    </section>
  );
}
