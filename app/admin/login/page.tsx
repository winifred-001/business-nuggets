"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

import {
  clearAdminSession,
  clearPendingAdminLogin,
  clearPendingAdminSetup,
  isAdminAccount,
  setPendingAdminLogin,
  setPendingAdminSetup,
  storeAdminSession,
  type AdminUser,
} from "@/lib/admin-auth";

type LoginResponse = {
  message?: string | string[];
  authenticated?: boolean;
  requiresTwoFactorSetup?: boolean;
  setupToken?: string;
  user?: AdminUser;
};

function responseMessage(data: LoginResponse, fallback: string) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  return data.message || fallback;
}

function requiresTwoFactor(message: string) {
  return message
    .toLowerCase()
    .includes("two-factor authentication code or recovery code required");
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkExistingAdmin() {
      try {
        const response = await fetch(
          "/api/admin/auth/session",
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          router.replace("/admin/dashboard");
          return;
        }

        clearAdminSession();
      } catch {
        clearAdminSession();
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    void checkExistingAdmin();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function verifyAndStoreSession(
    user: AdminUser,
  ) {
    if (!isAdminAccount(user)) {
      setError("This account does not have Admin Console access.");
      return false;
    }

    const verifyResponse = await fetch(
      "/api/admin/auth/session",
      {
        cache: "no-store",
      },
    );

    if (!verifyResponse.ok) {
      setError("Admin access could not be verified.");
      return false;
    }

    storeAdminSession("", user, keepSignedIn);
    clearPendingAdminLogin();
    clearPendingAdminSetup();
    router.replace("/admin/dashboard");

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Enter your admin email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          keepSignedIn,
        }),
      });

      const data: LoginResponse = await response.json().catch(() => ({}));

      if (
        data.requiresTwoFactorSetup &&
        data.setupToken &&
        data.user
      ) {
        if (!isAdminAccount(data.user)) {
          setError("This account does not have Admin Console access.");
          return;
        }

        clearPendingAdminLogin();
        setPendingAdminSetup({
          setupToken: data.setupToken,
          user: data.user,
        });

        router.push("/admin/setup-2fa");
        return;
      }

      if (!response.ok) {
        const message = responseMessage(
          data,
          "Invalid email or password.",
        );

        if (response.status === 401 && requiresTwoFactor(message)) {
          clearPendingAdminSetup();
          setPendingAdminLogin({
            email: normalizedEmail,
            password,
            keepSignedIn,
          });

          router.push("/admin/verify-2fa");
          return;
        }

        setError(message);
        return;
      }

      if (!data.authenticated || !data.user) {
        setError("The server did not return a complete admin session.");
        return;
      }

      await verifyAndStoreSession(data.user);
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-[11px] text-white/40">
        Checking Admin Console session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <header className="border-b border-white/[0.07] bg-[#111111]">
        <div className="flex h-[72px] items-center px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#C8A35A] font-serif text-[14px] font-bold text-[#080808]">
              B
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-white">
                Business Nuggets
              </p>
              <p className="mt-0.5 text-[8px] text-[#C8A35A]">
                Admin Console
              </p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-72px)] items-start justify-center px-5 py-16 sm:py-20">
        <section className="w-full max-w-[440px] rounded-[10px] border border-white/10 bg-[#111111] p-6 sm:p-8">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-[#C8A35A] text-[#080808]">
            <ShieldCheck size={20} />
          </div>

          <div className="mt-5 text-center">
            <h1 className="font-serif text-[28px] leading-tight">Admin Sign In</h1>
            <p className="mt-2 text-[11px] text-white/35">
              Authorised administrators only
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[9px] font-medium text-white/45"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="admin@businessnuggets.com"
                className="h-11 w-full rounded-md border border-white/10 bg-[#0D0D0D] px-4 text-[11px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/50"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="password"
                className="mb-2 block text-[9px] font-medium text-white/45"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-md border border-white/10 bg-[#0D0D0D] px-4 pr-11 text-[11px] text-white outline-none placeholder:text-white/20 focus:border-[#C8A35A]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition hover:text-white/60"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(event) => setKeepSignedIn(event.target.checked)}
                  className="h-3.5 w-3.5 accent-[#C8A35A]"
                />
                <span className="text-[9px] text-white/35">
                  Keep me signed in
                </span>
              </label>

              <Link
                href="/forgot-password"
                className="text-[9px] text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                <p className="text-[10px] leading-5 text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex min-h-10 w-full items-center justify-center rounded-md bg-[#C8A35A] px-4 text-[10px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Continue Secure Sign In"}
            </button>
          </form>

          <div className="mt-8 border-t border-white/[0.07] pt-6 text-center">
            <p className="text-[9px] leading-5 text-white/25">
              If two-factor authentication is required, you will verify it on the next screen.
            </p>
            <p className="text-[9px] leading-5 text-white/25">
              Need access? Contact the Super Admin.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
