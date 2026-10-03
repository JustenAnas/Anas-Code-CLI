"use client";

export default function DownloadAnas() {
  return (
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <div className="mb-8 text-9xl font-bold leading-none text-white">
        ANAS
      </div>

      <h2 className="text-4xl font-semibold text-white">ANAS CLI</h2>

      <p className="mt-6 max-w-xl text-lg text-white/60">
        Your AI coding agent for understanding codebases, editing files, running
        commands, and shipping faster.
      </p>

      <button
        type="button"
        className="mt-10 cursor-pointer rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition-transform duration-500 ease-out hover:scale-110"
      >
        Download
      </button>
    </section>
  );
}
