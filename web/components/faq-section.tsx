"use client";

import { useState } from "react";

const faqs = [
  {
    question: "What is ANAS CLI?",
    answer:
      "ANAS CLI is a multi-provider AI coding agent that works directly with your project, files, terminal, and development workflow.",
  },
  {
    question: "Which AI providers does ANAS support?",
    answer:
      "ANAS is designed to work with multiple providers, including Anthropic, OpenAI, OpenRouter, and Gemini.",
  },
  {
    question: "Can ANAS modify my files?",
    answer:
      "Yes. In Agent mode, ANAS can inspect your project, read files, make targeted changes, and run commands when needed.",
  },
  {
    question: "Do I have to use one AI model?",
    answer:
      "No. ANAS is multi-provider, so you can choose the provider and model that fits your workflow.",
  },
  {
    question: "Is ANAS free?",
    answer:
      "ANAS has a free option for getting started. Paid plans are available for developers who need higher usage and more advanced workflows.",
  },
  {
    question: "Is ANAS a replacement for my code editor?",
    answer:
      "Not necessarily. ANAS is built to work alongside your existing development environment and give you an AI agent directly in your workflow.",
  },
  {
    question: "Is my code uploaded somewhere?",
    answer:
      "ANAS only works with the project context required for the tasks you give it. Always review provider and application privacy policies before using sensitive code.",
  },
  {
    question: "How do I get started?",
    answer:
      "Install ANAS CLI, configure your AI provider, and start the agent from your terminal. The Getting Started section walks you through the process.",
  },
];

function FAQItem({
  question,
  answer,
  open,
  onClick,
}: {
  question: string;
  answer: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-t border-black/10">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-8 py-7 text-left"
      >
        <span className="text-xl font-medium tracking-tight md:text-2xl">
          {question}
        </span>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-2xl font-light transition-all duration-300 ${
            open ? "rotate-45 bg-black text-white" : "text-black"
          }`}
        >
          +
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="max-w-3xl pb-7 pr-16 text-base leading-relaxed text-black/50 md:text-lg">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative z-10 bg-white px-6 py-32 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.25em] text-black/40">
              FAQ
            </p>

            <h2 className="mt-8 text-6xl font-bold leading-[0.9] tracking-[-0.06em] md:text-8xl lg:text-[7rem]">
              Questions?
              <br />
              <span className="text-black/30">Answered.</span>
            </h2>

            <p className="mt-10 max-w-md text-lg leading-relaxed text-black/50 md:text-xl">
              Everything you need to know before you start building with ANAS.
            </p>
          </div>

          <div className="border-b border-black/10">
            {faqs.map((faq, index) => (
              <FAQItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                open={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>

        <hr className="mt-28 border-0 border-t border-black/20" />
      </div>
    </section>
  );
}
