"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

import { API_URL } from "@/lib/api";
import {
  clearAdminSession,
  clearPendingAdminLogin,
  getAdminToken,
  isAdminAccount,
  setPendingAdminLogin,
  storeAdminSession,
  type AdminUser,
} from "@/lib/admin-auth";

type LoginResponse = {
  message?: string | string[];
  token?: string;
  requiresEmailTwoFactor?: boolean;
  challengeToken?: string;
  user?: AdminUser;
};

function responseMessage(
  data: LoginResponse,
  fallback: string,
) {
  if (
    Array.isArray(
      data.message,
    )
  ) {
    return data.message.join(
      ", ",
    );
  }

  return data.message ||
    fallback;
}

export default function AdminLoginPage() {
  const router =
    useRouter();

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [keepSignedIn, setKeepSignedIn] =
    useState(false);
  const [checkingSession, setCheckingSession] =
    useState(true);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled =
      false;

    async function checkExistingAdmin() {
      const token =
        getAdminToken();

      if (!token) {
        if (!cancelled) {
          setCheckingSession(
            false,
          );
        }
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/admin/test`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (response.ok) {
          router.replace(
            "/admin/dashboard",
          );
          return;
        }

        clearAdminSession();
      } catch {
        clearAdminSession();
      } finally {
        if (!cancelled) {
          setCheckingSession(
            false,
          );
        }
      }
    }

    void checkExistingAdmin();

    return () => {
      cancelled =
        true;
    };
  }, [router]);

  async function verifyAndStoreSession(
    token: string,
    user: AdminUser,
  ) {
    if (
      !isAdminAccount(
        user,
      )
    ) {
      setError(
        "This account does not have Admin Console access.",
      );
      return false;
    }

    const verifyResponse =
      await fetch(
        `${API_URL}/admin/test`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

    if (!verifyResponse.ok) {
      setError(
        "Admin access could not be verified.",
      );
      return false;
    }

    storeAdminSession(
      token,
      user,
      keepSignedIn,
    );
    clearPendingAdminLogin();

    router.replace(
      "/admin/dashboard",
    );

    return true;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        "Enter your admin email and password.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                email:
                  normalizedEmail,
                password,
              }),
          },
        );

      const data:
        LoginResponse =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (!response.ok) {
        setError(
          responseMessage(
            data,
            "Invalid email or password.",
          ),
        );
        return;
      }

      if (
        data.requiresEmailTwoFactor
      ) {
        if (
          !data.challengeToken ||
          !data.user
        ) {
          setError(
            "The server did not return a complete email verification challenge.",
          );
          return;
        }

        if (
          !isAdminAccount(
            data.user,
          )
        ) {
          setError(
            "This account does not have Admin Console access.",
          );
          return;
        }

        setPendingAdminLogin({
          email:
            data.user.email ||
            normalizedEmail,
          challengeToken:
            data.challengeToken,
          keepSignedIn,
        });

        setPassword("");

        router.push(
          "/admin/verify-2fa",
        );
        return;
      }

      if (
        !data.token ||
        !data.user
      ) {
        setError(
          "The server did not return a complete admin session.",
        );
        return;
      }

      await verifyAndStoreSession(
        data.token,
        data.user,
      );
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-[14px] text-white/50">
        Checking Admin Console session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6]">
      <header className="border-b border-white/[0.07] bg-[#111111]">
        <div className="flex h-[76px] items-center px-6 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#C8A35A] font-serif text-[16px] font-bold text-[#080808]">
              B
            </div>
            <div>
              <p className="text-[16px] font-semibold text-white">
                Business Nuggets
              </p>
              <p className="text-[14px] text-[#C8A35A]">
                Admin Console
              </p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-76px)] items-start justify-center px-5 py-14 sm:py-20">
        <section className="w-full max-w-[500px] rounded-[12px] border border-white/10 bg-[#111111] p-6 sm:p-9">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#C8A35A] text-[#080808]">
            <ShieldCheck size={22} />
          </div>

          <div className="mt-6 text-center">
            <h1 className="font-serif text-[40px] leading-tight">
              Admin Sign In
            </h1>
            <p className="mt-3 text-[16px] leading-6 text-white/50">
              Sign in with your administrator account. If email verification is required, we will send a 6-digit code to your email.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[14px] font-medium text-white/65"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value,
                  );
                  setError("");
                }}
                placeholder="admin@businessnuggets.com"
                className="h-12 w-full rounded-md border border-white/10 bg-[#0D0D0D] px-4 text-[16px] text-white outline-none placeholder:text-white/25 focus:border-[#C8A35A]/60"
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="password"
                className="mb-2 block text-[14px] font-medium text-white/65"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(
                      event.target.value,
                    );
                    setError("");
                  }}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-md border border-white/10 bg-[#0D0D0D] px-4 pr-12 text-[16px] text-white outline-none placeholder:text-white/25 focus:border-[#C8A35A]/60"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
                >
                  {showPassword
                    ? <EyeOff size={19} />
                    : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(event) =>
                    setKeepSignedIn(
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 accent-[#C8A35A]"
                />
                <span className="text-[14px] text-white/55">
                  Keep me signed in
                </span>
              </label>

              <Link
                href="/forgot-password"
                className="text-[14px] text-[#C8A35A] transition hover:text-[#E0C48A]"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                <p className="text-[14px] leading-6 text-red-400">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-7 flex min-h-12 w-full items-center justify-center rounded-md bg-[#C8A35A] px-4 text-[16px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Signing in..."
                : "Continue Secure Sign In"}
            </button>
          </form>

          <div className="mt-8 border-t border-white/[0.07] pt-6 text-center">
            <p className="text-[14px] leading-6 text-white/40">
              Need Admin Console access? Contact the Super Admin.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
