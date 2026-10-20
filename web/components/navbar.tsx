"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [hovered, setHovered] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        setIsLoggedIn(res.ok);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      setIsLoggedIn(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

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
          href="/docs"
          className="transition-all duration-300 hover:scale-110 hover:font-bold"
        >
          Docs
        </a>

        <a
          href="https://github.com/JustenAnas/Anas-Code-CLI"
          className="transition-all duration-300 hover:scale-110 hover:font-bold"
        >
          GitHub
        </a>

        {!authLoading &&
          (isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={`rounded-full px-5 py-2.5 font-semibold transition-all duration-300 disabled:opacity-50 ${
                hovered
                  ? "bg-black text-white hover:scale-105"
                  : "bg-white text-black hover:scale-105"
              }`}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          ) : (
            <>
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
            </>
          ))}
      </div>
    </nav>
  );
}
