"use client";

import { useState } from "react";

export default function Navbar() {
  const [hovered, setHovered] = useState(false);

  return (
    <nav
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`sticky top-0 z-50 flex items-center justify-between px-8 py-6 transition-colors duration-300 ${
        hovered ? "bg-white text-black" : "bg-black text-white"
      }`}
    >
      <div className="text-2xl font-bold tracking-tight">ANAS CLI</div>

      <div className="flex items-center gap-8 text-base font-semibold">
        <a
          href="#features"
          className="transition-all duration-300 hover:scale-110 hover:font-bold"
        >
          Features
        </a>

        <a
          href="#docs"
          className="transition-all duration-300 hover:scale-110 hover:font-bold"
        >
          Docs
        </a>

        <a
          href="#github"
          className="transition-all duration-300 hover:scale-110 hover:font-bold"
        >
          GitHub
        </a>

        <a
          href="/login"
          className="transition-all duration-300 hover:scale-110 hover:font-bold"
        >
          Sign In
        </a>

        <a
          href="/signup"
          className={`rounded-full px-5 py-2.5 font-semibold transition-all duration-300 ${
            hovered
              ? "bg-black text-white hover:scale-105"
              : "bg-white text-black hover:scale-105"
          }`}
        >
          Get Started
        </a>
      </div>
    </nav>
  );
}
