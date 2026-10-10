"use client";

import { useState } from "react";

const reviewPages = [
  [
    {
      quote:
        "ANAS completely changed how I work with large codebases. I spend less time searching and more time building.",
      name: "Alex Morgan",
      role: "Senior Software Engineer",
    },
    {
      quote:
        "The agent feels like another developer sitting next to me. Fast, practical, and actually useful.",
      name: "Ryan Carter",
      role: "Full-Stack Developer",
    },
    {
      quote:
        "I gave ANAS a messy feature request and it figured out the project structure before touching anything.",
      name: "Maya Chen",
      role: "Product Engineer",
    },
    {
      quote:
        "Multi-provider support is exactly what I wanted. I can choose the model without changing my workflow.",
      name: "Daniel Brooks",
      role: "Independent Developer",
    },
    {
      quote:
        "The biggest difference is how little I have to explain my own codebase anymore.",
      name: "Sofia Wilson",
      role: "Frontend Engineer",
    },
    {
      quote:
        "ANAS turns the boring parts of development into something I barely have to think about.",
      name: "Ethan Lee",
      role: "Software Developer",
    },
    {
      quote:
        "I stopped jumping between my editor, terminal, and AI tools. Everything feels much more connected now.",
      name: "Noah Bennett",
      role: "Full-Stack Engineer",
    },
    {
      quote:
        "The workflow is simple: describe the task, let the agent inspect the project, then ship.",
      name: "Emma Davis",
      role: "Indie Hacker",
    },
    {
      quote:
        "It feels less like using an AI chatbot and more like working with an actual coding agent.",
      name: "Lucas Martin",
      role: "Backend Engineer",
    },
  ],
  [
    {
      quote:
        "ANAS made my daily development workflow noticeably faster without getting in my way.",
      name: "Jordan Smith",
      role: "Software Engineer",
    },
    {
      quote:
        "The codebase awareness is what impressed me most. It actually understands the context.",
      name: "Olivia Parker",
      role: "Web Developer",
    },
    {
      quote:
        "I can finally experiment with different models while keeping the same coding workflow.",
      name: "William Scott",
      role: "AI Engineer",
    },
    {
      quote:
        "Simple interface, powerful agent, and no unnecessary complexity. Exactly how developer tools should feel.",
      name: "Ava Thompson",
      role: "Frontend Developer",
    },
    {
      quote:
        "ANAS helped me turn a weekend idea into something I could actually deploy.",
      name: "James Wilson",
      role: "Founder",
    },
    {
      quote:
        "The agent-first workflow is incredibly satisfying once you get used to it.",
      name: "Grace Taylor",
      role: "Product Engineer",
    },
    {
      quote:
        "I wanted a coding agent that worked with my project instead of forcing me into a new workflow.",
      name: "Henry Adams",
      role: "Developer",
    },
    {
      quote:
        "It feels fast, focused, and designed around actually shipping software.",
      name: "Liam Cooper",
      role: "Full-Stack Developer",
    },
    {
      quote:
        "The difference between asking an AI questions and actually giving it work is huge.",
      name: "Chloe Evans",
      role: "Software Engineer",
    },
  ],
  [
    {
      quote:
        "I use ANAS whenever I want to move from an idea to a working implementation quickly.",
      name: "Benjamin King",
      role: "Independent Developer",
    },
    {
      quote:
        "The agent handles the repetitive work while I stay focused on the parts that actually matter.",
      name: "Isabella Moore",
      role: "Senior Developer",
    },
    {
      quote:
        "Having the agent understand the whole repository makes a massive difference.",
      name: "Michael Clark",
      role: "Backend Developer",
    },
    {
      quote: "This is the kind of developer tooling I've wanted for years.",
      name: "Amelia Hall",
      role: "Software Engineer",
    },
    {
      quote:
        "ANAS feels like a natural extension of the terminal rather than another tool I have to manage.",
      name: "Sebastian Young",
      role: "DevOps Engineer",
    },
    {
      quote:
        "The experience is straightforward: tell it what you need and get back to building.",
      name: "Harper Lewis",
      role: "Web Engineer",
    },
    {
      quote:
        "I spend less time fighting configuration and more time actually writing features.",
      name: "Matthew Walker",
      role: "Full-Stack Engineer",
    },
    {
      quote:
        "Once the agent understands the project, the workflow becomes incredibly smooth.",
      name: "Ella Wright",
      role: "Product Developer",
    },
    {
      quote:
        "ANAS gives me the feeling that my development environment is finally working with me.",
      name: "David Green",
      role: "Software Engineer",
    },
  ],
];

function ReviewCard({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <article className="w-[360px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur-sm transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.1] md:w-[420px]">
      <p className="min-h-[110px] text-base leading-relaxed text-white/70">
        “{quote}”
      </p>

      <div className="mt-8 border-t border-white/10 pt-5">
        <p className="font-medium text-white">{name}</p>
        <p className="mt-1 text-sm text-white/35">{role}</p>
      </div>
    </article>
  );
}

function ReviewRow({
  reviews,
  reverse = false,
}: {
  reviews: (typeof reviewPages)[number];
  reverse?: boolean;
}) {
  const repeatedReviews = [...reviews, ...reviews];

  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex w-max gap-5 ${
          reverse ? "animate-reviews-reverse" : "animate-reviews"
        }`}
      >
        {repeatedReviews.map((review, index) => (
          <ReviewCard
            key={`${review.name}-${index}`}
            quote={review.quote}
            name={review.name}
            role={review.role}
          />
        ))}
      </div>
    </div>
  );
}

export default function ReviewsSection() {
  const [page, setPage] = useState(0);

  const reviews = reviewPages[page];

  const goToPage = (nextPage: number) => {
    setPage(Math.max(0, Math.min(reviewPages.length - 1, nextPage)));
  };

  return (
    <section className="relative z-10 overflow-hidden bg-black px-6 py-32 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-5xl">
          <p className="text-base font-semibold uppercase tracking-[0.25em] text-white/40">
            Reviews
          </p>

          <h2 className="mt-8 text-6xl font-bold leading-[0.9] tracking-[-0.06em] md:text-8xl lg:text-[8rem]">
            What people say
            <br />
            <span className="text-white/30">after they ship.</span>
          </h2>

          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/40 md:text-xl">
            Developers use ANAS to understand their codebases, move faster, and
            spend more time building.
          </p>
        </div>

        <div className="mt-28 space-y-5">
          <ReviewRow reviews={reviews.slice(0, 3)} />

          <ReviewRow reviews={reviews.slice(3, 6)} reverse />

          <ReviewRow reviews={reviews.slice(6, 9)} />
        </div>

        <div className="mt-16 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page === 0}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-lg text-white/60 transition-all duration-300 hover:border-white/30 hover:bg-white hover:text-black disabled:pointer-events-none disabled:opacity-20"
          >
            ‹
          </button>

          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToPage(index)}
              className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium transition-all duration-300 ${
                page === index
                  ? "bg-white text-black"
                  : "border border-white/10 text-white/50 hover:border-white/30 hover:text-white"
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page === reviewPages.length - 1}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-lg text-white/60 transition-all duration-300 hover:border-white/30 hover:bg-white hover:text-black disabled:pointer-events-none disabled:opacity-20"
          >
            ›
          </button>
        </div>

        <hr className="mt-28 border-0 border-t border-white/10" />
      </div>
    </section>
  );
}
