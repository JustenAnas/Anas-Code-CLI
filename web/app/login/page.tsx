"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const GitHubIcon = (
  props: React.SVGProps<SVGSVGElement>
) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.537 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z" />
  </svg>
);

const GoogleIcon = (
  props: React.SVGProps<SVGSVGElement>
) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
  </svg>
);

const EyeIcon = (
  props: React.SVGProps<SVGSVGElement>
) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (
  props: React.SVGProps<SVGSVGElement>
) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
    <path d="M16.68 16.68A8.94 8.94 0 0 1 12 18c-5 0-8-6-8-6a15.8 15.8 0 0 1 3.32-4.32" />
    <path d="M6.61 6.61A8.94 8.94 0 0 1 12 6c5 0 8 6 8 6a15.8 15.8 0 0 1-2.04 3.19" />
    <path d="m2 2 20 20" />
  </svg>
);

export default function LoginPage() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<
    "github" | "google" | null
  >(null);

  useEffect(() => {
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setError(oauthError);
    }
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password.");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth(provider: "github" | "google") {
    setError("");
    setOauthLoading(provider);

    window.location.href = `/api/auth/${provider}?mode=login`;
  }

  const isLoading = loading || oauthLoading !== null;

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="grid min-h-dvh lg:grid-cols-2">
        {/* Left — Login */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight"
            >
              ANAS CLI
            </Link>

            <h1 className="mt-10 text-2xl font-semibold tracking-tight">
              Sign in to your account
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-white transition-opacity hover:opacity-70"
              >
                Sign up
              </Link>
            </p>

            {/* OAuth buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleOAuth("github")}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "flex-1 gap-2 border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <GitHubIcon className="size-5" />
                <span>
                  {oauthLoading === "github"
                    ? "Connecting..."
                    : "GitHub"}
                </span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleOAuth("google")}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "flex-1 gap-2 border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <GoogleIcon className="size-4" />
                <span>
                  {oauthLoading === "google"
                    ? "Connecting..."
                    : "Google"}
                </span>
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-white/10" />
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-2 text-white/30">
                  or
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-white"
                >
                  Email
                </Label>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isLoading}
                  className="mt-2 h-12 rounded-none border-2 border-white/20 bg-white/[0.03] px-4 text-white shadow-[4px_4px_0_rgba(255,255,255,0.12)] transition-all duration-200 placeholder:text-white/25 hover:border-white/35 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:border-white/60 focus-visible:ring-0 focus-visible:shadow-[2px_2px_0_rgba(255,255,255,0.35)]"
                />
              </div>

              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-white"
                >
                  Password
                </Label>

                <div className="relative mt-2">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 rounded-none border-2 border-white/20 bg-white/[0.03] px-4 pr-12 text-white shadow-[4px_4px_0_rgba(255,255,255,0.12)] transition-all duration-200 placeholder:text-white/25 hover:border-white/35 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:border-white/60 focus-visible:ring-0 focus-visible:shadow-[2px_2px_0_rgba(255,255,255,0.35)]"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={isLoading}
                    onClick={() =>
                      setShowPassword((visible) => !visible)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-5" />
                    ) : (
                      <EyeIcon className="size-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full bg-white py-2 font-medium text-black hover:bg-white/90"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-sm text-white/40">
              Forgot your password?{" "}
              <Link
                href="/forgot-password"
                className="font-medium text-white transition-opacity hover:opacity-70"
              >
                Reset password
              </Link>
            </p>
          </div>
        </div>

        {/* Right — animated gradient */}
        <div className="relative hidden overflow-hidden bg-black lg:block">
          <div
            className="absolute -inset-[12%] animate-[gradientDrift_18s_ease-in-out_infinite_alternate]"
            style={{
              background: `
                radial-gradient(
                  ellipse at 90% 100%,
                  rgba(245, 195, 55, 0.9) 0%,
                  rgba(245, 195, 55, 0.35) 18%,
                  transparent 48%
                ),
                radial-gradient(
                  ellipse at 32% 88%,
                  rgba(85, 48, 120, 0.7) 0%,
                  rgba(85, 48, 120, 0.3) 30%,
                  transparent 62%
                ),
                radial-gradient(
                  ellipse at 75% 70%,
                  rgba(42, 92, 180, 0.75) 0%,
                  rgba(42, 92, 180, 0.3) 32%,
                  transparent 65%
                ),
                radial-gradient(
                  ellipse at 18% 52%,
                  rgba(20, 55, 120, 0.9) 0%,
                  rgba(20, 55, 120, 0.45) 28%,
                  transparent 62%
                ),
                radial-gradient(
                  ellipse at 50% 0%,
                  #000000 0%,
                  #050b18 22%,
                  #07152d 42%,
                  #111d4a 58%,
                  #252060 70%,
                  #3d245e 82%,
                  #f0c84b 100%
                )
              `,
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.2)_35%,rgba(0,0,0,0)_65%)]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.2)_65%,rgba(0,0,0,0.55)_100%)]" />

          <style jsx>{`
            @keyframes gradientDrift {
              0% {
                transform: translate3d(-2%, -1%, 0) scale(1);
              }

              50% {
                transform: translate3d(2%, 1%, 0) scale(1.04);
              }

              100% {
                transform: translate3d(-1%, 2%, 0) scale(1.02);
              }
            }
          `}</style>
        </div>
      </div>
    </main>
  );
}