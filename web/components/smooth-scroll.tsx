"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,
    });

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

    const handleScroll = () => {
      ScrollTrigger.update();
    };

    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");

      if (!href?.startsWith("#")) return;

      const element = document.querySelector<HTMLElement>(href);

      if (!element) return;

      event.preventDefault();

      lenis.scrollTo(element);
    };

    lenis.on("scroll", handleScroll);

    document.addEventListener("click", handleAnchorClick);

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", handleScroll);
      document.removeEventListener("click", handleAnchorClick);
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  return null;
}
