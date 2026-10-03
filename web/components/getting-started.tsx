"use client";

import { useState } from "react";

const installCommands = {
  npm: "npm install -g anas-cli",
  npx: "npx anas-cli",
  pnpm: "pnpm add -g anas-cli",
  yarn: "yarn global add anas-cli",
  bun: "bun add -g anas-cli",
};

const tabs = Object.keys(installCommands) as Array<
  keyof typeof installCommands
>;

const providers = ["claude", "openai", "openrouter", "gemini"];

const modes = [
  {
    name: "agent",
    title: "AGENT",
    description: "Read, edit, and run commands — full agent loop with tools",
  },
  {
    name: "ask",
    title: "ASK",
    description: "Read-only exploration — answers without changing files",
  },
  {
    name: "plan",
    title: "PLAN",
    description: "Explore and propose a plan — no file edits applied",
  },
];

export default function GettingStarted() {
  const [activeTab, setActiveTab] =
    useState<keyof typeof installCommands>("npm");
  const [copied, setCopied] = useState(false);
  const [hasSelectedInstall, setHasSelectedInstall] = useState(false);

  const [provider, setProvider] = useState("openrouter");
  const [mode, setMode] = useState("agent");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const command = installCommands[activeTab];
  const selectedMode = modes.find((item) => item.name === mode) ?? modes[0];

  const startupCommand = hasSelectedInstall
    ? command
    : "npx tsx src/index.ts wakeup";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = input.trim();

    if (!message) return;

    setMessages((current) => [...current, message]);
    setInput("");
  };

  return (
    <section
      id="getting-started"
      className="relative z-10 bg-black px-6 py-32 text-white"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">
            Getting Started
          </p>

          <h2 className="mt-8 text-6xl font-bold leading-[0.9] tracking-[-0.06em] md:text-8xl lg:text-[9rem]">
            Your terminal.
            <br />
            <span className="text-white/30">Your agent.</span>
          </h2>

          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl">
            Install ANAS, launch your agent, and start building without leaving
            your terminal.
          </p>
        </div>

        {/* Installation */}
        <div className="mt-28">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/30">
              01 — Install
            </p>

            <h3 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Get ANAS running.
            </h3>
          </div>

          {/* Install tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setHasSelectedInstall(true);
                }}
                className={`rounded-full px-5 py-2.5 font-mono text-sm transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-white text-black"
                    : "border border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Install terminal */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              </div>

              <span className="font-mono text-xs text-white/30">
                {activeTab}
              </span>
            </div>

            <div className="flex min-h-28 items-center justify-between gap-6 px-6 py-7 md:px-8">
              <div className="overflow-x-auto font-mono text-sm md:text-base">
                <span className="text-white/30">$ </span>
                <span className="whitespace-nowrap text-white">{command}</span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white/60 transition-all duration-300 hover:scale-110 hover:border-white/30 hover:text-white"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Playground */}
        <div className="mt-40">
          <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/30">
                02 — Playground
              </p>

              <h3 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Meet your coding agent.
              </h3>

              <p className="mt-5 max-w-xl text-white/40">
                Pick a provider, choose a mode, and try the ANAS experience
                directly in your browser.
              </p>
            </div>

            <h4 className="max-w-xl text-right text-4xl font-bold leading-none tracking-[-0.04em] text-white md:text-6xl">
              Wanna see what
              <br />
              you&apos;re getting?
            </h4>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080808] shadow-2xl">
            {/* Terminal header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-white/20" />
                <span className="h-3 w-3 rounded-full bg-white/20" />
                <span className="h-3 w-3 rounded-full bg-white/20" />
              </div>

              <span className="font-mono text-xs text-white/30">ANAS CLI</span>

              <span className="text-xs text-white/20">— □ ×</span>
            </div>

            {/* Terminal content */}
            <div className="min-h-[520px] overflow-x-auto p-6 font-mono text-sm leading-7 md:p-10 md:text-base">
              {/* Startup command */}
              <div className="text-white/60">
                <span className="text-white/30">$ </span>
                {startupCommand}
              </div>

              {/* ASCII logo */}
              <pre className="mt-6 overflow-x-auto text-sm leading-5 text-white/70">
                {`     _                               _ _
    / \\   _ __   __ _ ___        ___| (_)
   / _ \\ | '_ \\ / _\` / __|_____ / __| | |
  / ___ \\| | | | (_| \\__ \\_____| (__| | |
 /_/   \\_\\_| |_|\\__,_|___/      \\___|_|_|`}
              </pre>

              {/* Startup box */}
              <pre className="mt-8 max-w-full overflow-x-auto text-sm leading-7 text-white/70">
                {`┌──────────────────────────────────┐
│ Multi-provider AI coding CLI     │
│ Full Production Ready            │
└──────────────────────────────────┘`}
              </pre>

              {/* Startup comments */}
              <div className="mt-6 space-y-1 text-white/30">
                <div># Checking your environment</div>
                <div># Connecting your AI provider</div>
                <div># Preparing your coding agent</div>
              </div>

              {/* Checks */}
              <div className="mt-6 space-y-1">
                <div className="text-green-400">✓ Node.js is &gt;= 18</div>
                <div className="text-green-400">✓ API key connected</div>
              </div>

              {/* Provider */}
              <div className="mt-8 text-white/50">
                ✔ Choose a provider:{" "}
                <span className="text-yellow-400">{provider}</span>
              </div>

              {/* Provider selector */}
              <div className="mt-3 flex flex-wrap gap-2">
                {providers.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setProvider(item)}
                    className={`rounded-md border px-3 py-1.5 text-xs transition-all duration-200 ${
                      provider === item
                        ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Mode options */}
              <div className="mt-8 space-y-3">
                {modes.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setMode(item.name)}
                    className={`block w-full max-w-3xl rounded-xl border p-5 text-left transition-all duration-300 ${
                      mode === item.name
                        ? "border-white/30 bg-white/[0.06]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div
                      className={
                        mode === item.name ? "text-fuchsia-400" : "text-white"
                      }
                    >
                      {item.title}
                    </div>

                    <div className="text-white/40">{item.description}</div>
                  </button>
                ))}
              </div>

              {/* Selected mode */}
              <div className="mt-6 text-white/50">
                ✔ Choose a mode to start:{" "}
                <span className="text-fuchsia-400">{selectedMode.name}</span> —{" "}
                {selectedMode.description}
              </div>

              {/* Chat started */}
              <div className="mt-6 text-white/50">
                Chat started · provider:{" "}
                <span className="text-yellow-400">{provider}</span> · mode:{" "}
                <span className="text-fuchsia-400">{mode}</span>
              </div>

              <div className="text-white/30">
                Type /help for commands, /exit to quit.
              </div>

              {/* Continuous chat */}
              <div className="mt-8 space-y-7">
                {messages.map((message, index) => (
                  <div key={`${message}-${index}`}>
                    <div className="text-white">
                      <span className="text-white/30">? You: </span>
                      {message}
                    </div>

                    <div className="mt-4 max-w-3xl text-rose-400">
                      Assistant: Thanks for trying ANAS. This is the playground
                      demo — the real coding agent is waiting for you.
                    </div>
                  </div>
                ))}
              </div>

              {/* User input */}
              <form
                onSubmit={handleSubmit}
                className="mt-8 flex items-center gap-2"
              >
                <span className="shrink-0 text-white/30">? You:</span>

                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask ANAS anything..."
                  className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/20"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
