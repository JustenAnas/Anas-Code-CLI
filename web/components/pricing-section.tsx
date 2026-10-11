"use client";

import { useState } from "react";
import OilShader from "@/components/oil-shader";

type PlanName = "Free" | "Builder" | "Pro" | "Scale";
type Currency = "USD" | "INR";

type RazorpayOrder = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  plan: PlanName;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal: {
    ondismiss: () => void;
  };
  theme: {
    color: string;
  };
};

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions
    ) => {
      open: () => void;
    };
  }
}

const plans: {
  name: PlanName;
  price: number;
  description: string;
  features: string[];
  featured: boolean;
}[] = [
  {
    name: "Free",
    price: 0,
    description: "For trying ANAS and getting started.",
    features: [
      "Basic AI coding agent",
      "Limited usage",
      "Core tools",
      "Community support",
    ],
    featured: false,
  },
  {
    name: "Builder",
    price: 19,
    description: "For developers building every day.",
    features: [
      "Everything in Free",
      "More AI usage",
      "Multi-provider access",
      "Priority processing",
    ],
    featured: true,
  },
  {
    name: "Pro",
    price: 49,
    description: "For serious development workflows.",
    features: [
      "Everything in Builder",
      "Higher usage limits",
      "Advanced agent workflows",
      "Priority support",
    ],
    featured: false,
  },
  {
    name: "Scale",
    price: 99,
    description: "For teams shipping at higher velocity.",
    features: [
      "Everything in Pro",
      "Team workflows",
      "Higher limits",
      "Early access to features",
    ],
    featured: false,
  },
];

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () =>
        resolve(Boolean(window.Razorpay))
      );
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingSection() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [loadingPlan, setLoadingPlan] = useState<PlanName | null>(null);
  const [message, setMessage] = useState("");

  function getPrice(plan: (typeof plans)[number]) {
    const symbol = currency === "USD" ? "$" : "₹";
    return `${symbol}${plan.price}`;
  }

  async function handleCheckout(plan: (typeof plans)[number]) {
    setLoadingPlan(plan.name);
    setMessage("");

    try {
      const loaded = await loadRazorpay();

      if (!loaded || !window.Razorpay) {
        throw new Error("Could not load Razorpay Checkout.");
      }

      const response = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: plan.name,
          currency,
        }),
      });

      const order = (await response.json()) as
        | RazorpayOrder
        | { error: string };

      if (!response.ok || !("orderId" in order)) {
        throw new Error(
          "error" in order ? order.error : "Could not create order."
        );
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ANAS CLI",
        description:
          plan.name === "Free"
            ? `ANAS CLI Free — ${currency === "USD" ? "$1 USD" : "₹1 INR"} test payment`
            : `ANAS CLI ${plan.name} — ${getPrice(plan)} ${currency}`,
        order_id: order.orderId,
        theme: {
          color: "#000000",
        },
        handler: (payment) => {
          setMessage(
            `Payment ID: ${payment.razorpay_payment_id}. ` +
              "Payment is not yet verified server-side."
          );
        },
        modal: {
          ondismiss: () => setMessage("Checkout closed."),
        },
      });

      checkout.open();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <section className="relative z-10 overflow-hidden bg-black px-6 py-32 text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <OilShader />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="max-w-5xl">
          <p className="text-base font-semibold uppercase tracking-[0.25em] text-white/70">
            Pricing
          </p>

          <h2 className="mt-8 text-6xl font-bold leading-[0.9] tracking-[-0.06em] text-white md:text-8xl lg:text-[8rem]">
            Pick your
            <br />
            <span className="text-white/40">way to build.</span>
          </h2>

          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
            Start free, upgrade when you need more power, and keep building
            with ANAS.
          </p>
        </div>

        {/* Currency toggle */}
<div className="mt-12 flex justify-center">
  <div className="flex gap-2 rounded-full bg-transparent p-1">
    {(["USD", "INR"] as const).map((option) => (
      <button
        key={option}
        type="button"
        onClick={() => setCurrency(option)}
        aria-pressed={currency === option}
        className={`rounded-full border px-6 py-3 text-sm font-semibold transition-all duration-200 ${
          currency === option
            ? "border-black bg-black text-white"
            : "border-white bg-white text-black hover:bg-white/90"
        }`}
      >
        {option === "USD" ? "$ USD" : "₹ INR"}
      </button>
    ))}
  </div>
</div>


        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex min-h-[500px] flex-col rounded-2xl border p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 ${
                plan.featured
                  ? "border-white/20 bg-black/80 text-white"
                  : "border-white/20 bg-white/95 text-black"
              }`}
            >
              <div>
                <p
                  className={`text-sm font-semibold uppercase tracking-[0.2em] ${
                    plan.featured ? "text-white/50" : "text-black/40"
                  }`}
                >
                  {plan.name}
                </p>

                <div className="mt-8 flex items-end gap-2">
                  <span className="text-5xl font-bold tracking-[-0.05em]">
                    {getPrice(plan)}
                  </span>

                  <span
                    className={`mb-1 text-sm ${
                      plan.featured ? "text-white/40" : "text-black/40"
                    }`}
                  >
                    / month
                  </span>
                </div>

                <p
                  className={`mt-6 text-sm leading-relaxed ${
                    plan.featured ? "text-white/50" : "text-black/50"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <div
                className={`my-8 h-px ${
                  plan.featured ? "bg-white/10" : "bg-black/10"
                }`}
              />

              <div className="space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-3 text-sm">
                    <span
                      className={plan.featured ? "text-white" : "text-black"}
                    >
                      ✓
                    </span>
                    <span
                      className={
                        plan.featured ? "text-white/60" : "text-black/60"
                      }
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void handleCheckout(plan)}
                disabled={loadingPlan !== null}
                className={`mt-auto w-full rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.03] disabled:cursor-wait disabled:opacity-60 ${
                  plan.featured
                    ? "bg-white text-black"
                    : "bg-black text-white"
                }`}
              >
                {loadingPlan === plan.name
                  ? "Preparing checkout..."
                  : plan.name === "Free"
                    ? `Test checkout · ${currency === "USD" ? "$1" : "₹1"}`
                    : `Test checkout · ${getPrice(plan)}`}
              </button>
            </div>
          ))}
        </div>

        {message && (
          <p
            role="status"
            aria-live="polite"
            className="mt-6 break-words text-sm text-white/70"
          >
            {message}
          </p>
        )}

        <hr className="mt-28 border-0 border-t border-white/20" />
      </div>
    </section>
  );
}

