"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const OTP_DURATION = 2 * 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step, setStep] = useState<"email" | "otp" | "password">("email");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);

    setOtp((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  function handleOtpKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/forgot-password/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setMessage(
        data.message || "If an account exists, a reset code has been sent.",
      );

      setTimeLeft(OTP_DURATION);
      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    const code = otp.join("");

    if (code.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/forgot-password/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid or expired code.");
        return;
      }

      setMessage("Code verified. You can now create a new password.");
      setStep("password");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to reset password.");
        return;
      }

      window.location.href = "/login";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-white"
            >
              ANAS CLI
            </Link>
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-8">
            <div className="mb-8">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/30">
                Account recovery
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                {step === "email" && "Forgot your password?"}
                {step === "otp" && "Verify your code"}
                {step === "password" && "Create a new password"}
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-white/40">
                {step === "email" &&
                  "Enter your email and we'll send you a verification code."}

                {step === "otp" && `Enter the 6-digit code sent to ${email}.`}

                {step === "password" &&
                  "Choose a new password for your ANAS CLI account."}
              </p>
            </div>

            {step === "email" && (
              <form onSubmit={handleRequestCode} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-white/70"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="mt-2 h-12 w-full border border-white/15 bg-white/[0.03] px-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/50"
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full bg-white text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset code"}
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-white/70">
                    Verification code
                  </label>

                  <div className="mt-3 flex gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digit}
                        onChange={(event) =>
                          handleOtpChange(index, event.target.value)
                        }
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        className="h-14 w-full border border-white/15 bg-white/[0.03] text-center text-xl font-semibold text-white outline-none transition-colors focus:border-white/50"
                      />
                    ))}
                  </div>
                </div>

                {message && <p className="text-sm text-green-400">{message}</p>}

                {error && <p className="text-sm text-red-400">{error}</p>}

                {timeLeft > 0 ? (
                  <p className="font-mono text-xs text-white/40">
                    OTP expires in{" "}
                    <span className="text-white/70">
                      {formatTime(timeLeft)}
                    </span>
                  </p>
                ) : (
                  <p className="font-mono text-xs text-red-400">
                    OTP expired. Please request a new code.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || timeLeft === 0}
                  className="h-12 w-full bg-white text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp(["", "", "", "", "", ""]);
                    setTimeLeft(0);
                    setMessage("");
                    setError("");
                  }}
                  className="w-full text-sm text-white/40 transition-colors hover:text-white"
                >
                  ← Use a different email
                </button>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-white/70"
                  >
                    New password
                  </label>

                  <div className="relative mt-2">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="h-12 w-full border border-white/15 bg-white/[0.03] px-4 pr-12 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/50"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
                    >
                      {showPassword ? "◉" : "◌"}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-white/70"
                  >
                    Confirm password
                  </label>

                  <div className="relative mt-2">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter your password again"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      required
                      className="h-12 w-full border border-white/15 bg-white/[0.03] px-4 pr-12 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/50"
                    />

                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      onClick={() =>
                        setShowConfirmPassword((visible) => !visible)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
                    >
                      {showConfirmPassword ? "◉" : "◌"}
                    </button>
                  </div>
                </div>

                {message && <p className="text-sm text-green-400">{message}</p>}

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full bg-white text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset password"}
                </button>
              </form>
            )}

            <div className="mt-8 border-t border-white/10 pt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-white/40 transition-colors hover:text-white"
              >
                ← Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
