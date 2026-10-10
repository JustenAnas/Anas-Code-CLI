"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const gradientDrift = `
  @keyframes gradientDrift {
    0%, 100% {
      transform: scale(1) translate3d(0, 0, 0);
    }
    50% {
      transform: scale(1.08) translate3d(-2%, 1%, 0);
    }
  }
`;

const inputStyles = `
  .anas-input__container {
    position: relative;
    background: #f0f0f0;
    padding: 14px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 0;
    border: 4px solid #000;
    width: 100%;
    transition: all 400ms cubic-bezier(0.23, 1, 0.32, 1);
    transform-style: preserve-3d;
    transform: rotateX(3deg) rotateY(-3deg);
    perspective: 1000px;
    box-shadow: 8px 8px 0 #000;
  }

  .anas-input__container:hover {
    transform: rotateX(1deg) rotateY(0deg) scale(1.02);
    box-shadow: 14px 14px 0 -3px #e9b50b, 14px 14px 0 0 #000;
  }

  .anas-input__container:focus-within {
    transform: rotateX(1deg) rotateY(0deg) scale(1.02);
    box-shadow: 14px 14px 0 -3px #e9b50b, 14px 14px 0 0 #000;
  }

  .anas-input__shadow {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    bottom: 0;
    z-index: -1;
    transform: translateZ(-50px);
    background: linear-gradient(
      45deg,
      rgba(255, 107, 107, 0.4) 0%,
      rgba(255, 107, 107, 0.1) 100%
    );
    filter: blur(20px);
  }

  .anas-input__icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    cursor: default;
    border: 3px solid #000;
    background: #e9b50b;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    transform: translateZ(20px);
    position: relative;
    z-index: 3;
    transition: all 400ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  .anas-input__container:hover .anas-input__icon,
  .anas-input__container:focus-within .anas-input__icon {
    transform: translateZ(10px) translateX(-5px) translateY(-5px);
    box-shadow: 5px 5px 0 0 #000;
  }

  .anas-input__icon svg {
    width: 22px;
    height: 22px;
    stroke: #000;
  }

  .anas-input__search {
    width: 100%;
    height: 48px;
    outline: none;
    border: 3px solid #000;
    border-left: 0;
    padding: 12px 15px;
    font-size: 17px;
    background: #fff;
    color: #000;
    transform: translateZ(10px);
    transition: all 400ms cubic-bezier(0.23, 1, 0.32, 1);
    position: relative;
    z-index: 3;
    font-family: "Roboto", Arial, sans-serif;
    letter-spacing: -0.5px;
  }

  .anas-input__search::placeholder {
    color: #666;
    font-weight: bold;
    text-transform: uppercase;
  }

  .anas-input__search:hover,
  .anas-input__search:focus {
    background: #f0f0f0;
    transform: translateZ(20px) translateX(-5px) translateY(-5px);
    box-shadow: 5px 5px 0 0 #000;
  }

  .anas-input__container::before {
    content: attr(data-label);
    position: absolute;
    top: -15px;
    left: 20px;
    background: #e9b50b;
    color: #000;
    font-weight: bold;
    padding: 5px 10px;
    font-size: 14px;
    transform: translateZ(50px);
    z-index: 4;
    border: 2px solid #000;
    font-family: "Roboto", Arial, sans-serif;
  }
`;

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.01-2.13-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.94.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.35.78 1.04.78 2.1 0 1.52-.01 2.74-.01 3.11 0 .3.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.78-.07-1.54-.2-2.27H12v4.3h5.22a4.46 4.46 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.93-4.18 2.93-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.75 9.75 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.85A5.86 5.86 0 0 1 6.24 12c0-.64.11-1.26.3-1.85V7.63H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.05 4.37l3.24-2.52Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.12c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.22 14.63 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.63l3.24 2.52C7.31 7.84 9.46 6.12 12 6.12Z"
      />
    </svg>
  );
}

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
      <path d="M16.68 16.68A8.94 8.94 0 0 1 12 18c-5 0-8-6-8-6a15.8 15.8 0 0 1 3.32-4.32" />
      <path d="M6.61 6.61A8.94 8.94 0 0 1 12 6c5 0 8 6 8 6a15.8 15.8 0 0 1-2.04 3.19" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setOtpStep(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setOtpLoading(true);

    try {
      const response = await fetch("/api/signup/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid verification code.");
        return;
      }

      window.location.href = "/login";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-black text-white">
      <style
        dangerouslySetInnerHTML={{ __html: gradientDrift + inputStyles }}
      />

      <div className="grid min-h-dvh lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-16 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              ANAS CLI
            </Link>

            <div className="mt-12">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/30">
                {otpStep ? "Verify your email" : "Create your account"}
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                {otpStep ? "Check your inbox." : "Start building."}
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-white/40">
                {otpStep
                  ? `We sent a 6-digit verification code to ${email}.`
                  : "Create your ANAS account and start coding with your agent."}
              </p>
            </div>

            {!otpStep ? (
              <form onSubmit={handleSubmit} className="mt-10 space-y-8">
                {/* Name */}
                <div className="anas-input__container" data-label="NAME">
                  <div className="anas-input__shadow" />

                  <div className="anas-input__icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="YOUR NAME"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="anas-input__search"
                  />
                </div>

                {/* Email */}
                <div className="anas-input__container" data-label="EMAIL">
                  <div className="anas-input__shadow" />

                  <div className="anas-input__icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="YOUR EMAIL"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="anas-input__search"
                  />
                </div>

                {/* Password */}
                <div className="anas-input__container" data-label="PASSWORD">
                  <div className="anas-input__shadow" />

                  <div className="anas-input__icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>

                  <div className="relative w-full">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="YOUR PASSWORD"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="anas-input__search pr-12"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 z-50 -translate-y-1/2 translate-z-[30px] text-black/50 transition-colors hover:text-black"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="size-5" />
                      ) : (
                        <EyeIcon className="size-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                {/* OAuth */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/api/auth/github?mode=signup";
                    }}
                    className="flex h-11 items-center justify-center gap-2 border border-white/15 bg-white/[0.03] text-sm text-white/60 transition-colors hover:border-white/30 hover:text-white"
                  >
                    <GitHubIcon className="h-4 w-4" />
                    GitHub
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/api/auth/google?mode=signup";
                    }}
                    className="flex h-11 items-center justify-center gap-2 border border-white/15 bg-white/[0.03] text-sm text-white/60 transition-colors hover:border-white/30 hover:text-white"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    Google
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10" />

                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/20">
                    or
                  </span>

                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full border-[3px] border-black bg-[#e9b50b] font-bold uppercase tracking-wide text-black shadow-[5px_5px_0_#000] transition-all duration-300 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#000] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending code..." : "Create account"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="mt-10 space-y-8">
                <div
                  className="anas-input__container"
                  data-label="VERIFICATION CODE"
                >
                  <div className="anas-input__shadow" />

                  <div className="anas-input__icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M8 12h8" />
                      <path d="M12 8v8" />
                    </svg>
                  </div>

                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="6-DIGIT CODE"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    className="anas-input__search tracking-[0.4em]"
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="h-12 w-full border-[3px] border-black bg-[#e9b50b] font-bold uppercase tracking-wide text-black shadow-[5px_5px_0_#000] transition-all duration-300 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#000] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {otpLoading ? "Verifying..." : "Verify email"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    setOtp("");
                    setError("");
                  }}
                  className="w-full text-sm text-white/40 transition-colors hover:text-white"
                >
                  ← Back to signup
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-white/40">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-white transition-colors hover:text-white/60"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Right — Same gradient animation as Login */}
        <div className="relative hidden overflow-hidden lg:block">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(
                  circle at 15% 75%,
                  rgba(37, 99, 235, 0.85) 0%,
                  rgba(37, 99, 235, 0.55) 20%,
                  transparent 55%
                ),
                radial-gradient(
                  circle at 45% 55%,
                  rgba(59, 130, 246, 0.7) 0%,
                  rgba(59, 130, 246, 0.35) 25%,
                  transparent 60%
                ),
                radial-gradient(
                  circle at 85% 85%,
                  rgba(234, 179, 8, 0.75) 0%,
                  rgba(234, 179, 8, 0.35) 25%,
                  transparent 60%
                ),
                linear-gradient(
                  135deg,
                  #000000 0%,
                  #050505 25%,
                  #111827 48%,
                  #172554 68%,
                  #1e3a8a 82%,
                  #422006 100%
                )
              `,
              animation: "gradientDrift 12s ease-in-out infinite",
            }}
          />

          <div className="absolute inset-0 bg-black/10" />
        </div>
      </div>
    </main>
  );
}
