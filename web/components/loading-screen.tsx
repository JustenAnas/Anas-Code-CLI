"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2500;
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = time - start;
      const value = Math.min(Math.floor((elapsed / duration) * 100), 100);

      setProgress(value);

      if (value < 100) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(onComplete, 400);
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-9999 flex flex-col justify-between bg-black p-8 text-white">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm tracking-[0.2em] text-white/50">
          ANAS CLI
        </span>

        <span className="font-mono text-xs uppercase tracking-widest text-white/30">
          Initializing
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div className="h-px flex-1 bg-white/10">
          <div
            className="h-full bg-white transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="ml-6 min-w-[5ch] text-right font-mono text-5xl font-medium tracking-tighter">
          {progress}%
        </span>
      </div>
    </div>
  );
}
