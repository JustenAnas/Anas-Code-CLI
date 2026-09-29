export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-6">
      <div className="text-xl font-bold tracking-tight">ANAS</div>

      <div className="flex items-center gap-8 text-sm">
        <a
          href="#features"
          className="text-white/60 transition hover:text-white"
        >
          Features
        </a>

        <a href="#docs" className="text-white/60 transition hover:text-white">
          Docs
        </a>

        <a href="#github" className="text-white/60 transition hover:text-white">
          GitHub
        </a>

        <a href="/login" className="text-white/60 transition hover:text-white">
          Sign In
        </a>

        <a
          href="/signup"
          className="rounded-full bg-white px-5 py-2.5 font-medium text-black transition hover:bg-white/90"
        >
          Get Started
        </a>
      </div>
    </nav>
  );
}
