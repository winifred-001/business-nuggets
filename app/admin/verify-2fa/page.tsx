"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Mail, ShieldCheck } from "lucide-react";

import { API_URL } from "@/lib/api";
import {
  clearPendingAdminLogin,
  getPendingAdminLogin,
  isAdminAccount,
  setPendingAdminLogin,
  storeAdminSession,
  type AdminUser,
  type PendingAdminLogin,
} from "@/lib/admin-auth";

type VerifyResponse = {
  message?: string | string[];
  token?: string;
  user?: AdminUser;
};

type ResendResponse = {
  message?: string | string[];
  challengeToken?: string;
};

function responseMessage(
  data: {
    message?: string | string[];
  },
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

export default function AdminVerifyTwoFactorPage() {
  const router =
    useRouter();

  const [pending, setPending] =
    useState<PendingAdminLogin | null>(
      null,
    );
  const [ready, setReady] =
    useState(false);
  const [code, setCode] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [resending, setResending] =
    useState(false);
  const [error, setError] =
    useState("");
  const [notice, setNotice] =
    useState("");

  useEffect(() => {
    const login =
      getPendingAdminLogin();

    if (!login) {
      router.replace(
        "/admin/login",
      );
      return;
    }

    setPending(
      login,
    );
    setReady(true);
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!pending) {
      return;
    }

    const normalizedCode =
      code.trim();

    if (
      !/^\d{6}$/.test(
        normalizedCode,
      )
    ) {
      setError(
        "Enter the 6-digit code sent to your email.",
      );
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response =
        await fetch(
          `${API_URL}/auth/2fa/verify-email`,
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                challengeToken:
                  pending.challengeToken,
                code:
                  normalizedCode,
              }),
          },
        );

      const data:
        VerifyResponse =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (
        !response.ok ||
        !data.token ||
        !data.user
      ) {
        setError(
          responseMessage(
            data,
            "The verification code could not be verified.",
          ),
        );
        return;
      }

      if (
        !isAdminAccount(
          data.user,
        )
      ) {
        clearPendingAdminLogin();
        setError(
          "This account does not have Admin Console access.",
        );
        return;
      }

      const verifyResponse =
        await fetch(
          `${API_URL}/admin/test`,
          {
            headers: {
              Authorization:
                `Bearer ${data.token}`,
            },
          },
        );

      if (!verifyResponse.ok) {
        setError(
          "Admin access could not be verified.",
        );
        return;
      }

      storeAdminSession(
        data.token,
        data.user,
        pending.keepSignedIn,
      );
      clearPendingAdminLogin();

      router.replace(
        "/admin/dashboard",
      );
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (
      !pending ||
      resending
    ) {
      return;
    }

    setResending(true);
    setError("");
    setNotice("");

    try {
      const response =
        await fetch(
          `${API_URL}/auth/2fa/resend-email`,
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                challengeToken:
                  pending.challengeToken,
              }),
          },
        );

      const data:
        ResendResponse =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (
        !response.ok ||
        !data.challengeToken
      ) {
        setError(
          responseMessage(
            data,
            "A new verification code could not be sent.",
          ),
        );
        return;
      }

      const updatedPending = {
        ...pending,
        challengeToken:
          data.challengeToken,
      };

      setPendingAdminLogin(
        updatedPending,
      );
      setPending(
        updatedPending,
      );
      setCode("");
      setNotice(
        "A new 6-digit code was sent to your email.",
      );
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setResending(false);
    }
  }

  function goBack() {
    clearPendingAdminLogin();
    router.replace(
      "/admin/login",
    );
  }

  if (
    !ready ||
    !pending
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-[14px] text-white/50">
        Preparing email verification...
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
        <section className="w-full max-w-[520px] rounded-[12px] border border-white/10 bg-[#111111] p-6 sm:p-9">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#C8A35A]/15 text-[#C8A35A]">
            <Mail size={22} />
          </div>

          <div className="mt-6 text-center">
            <h1 className="font-serif text-[40px] leading-tight">
              Check Your Email
            </h1>
            <h2 className="mt-3 text-[28px] font-medium text-white/90">
              Admin Verification
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-white/50">
              We sent a 6-digit verification code to
              {" "}
              <span className="font-medium text-white/80">
                {pending.email}
              </span>
              . Enter it below to finish signing in.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8"
          >
            <label
              htmlFor="email-verification-code"
              className="mb-2 block text-[14px] font-medium text-white/65"
            >
              Verification code
            </label>

            <div className="relative">
              <ShieldCheck
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C8A35A]"
              />
              <input
                id="email-verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                maxLength={6}
                onChange={(event) => {
                  setCode(
                    event.target.value.replace(
                      /\D/g,
                      "",
                    ),
                  );
                  setError("");
                  setNotice("");
                }}
                placeholder="000000"
                autoFocus
                className="h-14 w-full rounded-md border border-white/10 bg-[#0D0D0D] px-12 text-center text-[28px] tracking-[0.3em] text-white outline-none placeholder:text-white/15 focus:border-[#C8A35A]/60"
              />
            </div>

            {notice && (
              <div className="mt-5 rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
                <p className="text-[14px] leading-6 text-emerald-400">
                  {notice}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                <p className="text-[14px] leading-6 text-red-400">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                code.length !== 6
              }
              className="mt-7 flex min-h-12 w-full items-center justify-center rounded-md bg-[#C8A35A] px-4 text-[16px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Verifying..."
                : "Verify & Open Admin Console"}
            </button>
          </form>

          <div className="mt-7 flex flex-col items-center gap-4 border-t border-white/[0.07] pt-6">
            <p className="text-center text-[14px] leading-6 text-white/45">
              Didn&apos;t receive the email? Check your spam folder or request a new code.
            </p>

            <button
              type="button"
              onClick={() =>
                void resendCode()
              }
              disabled={resending}
              className="text-[14px] font-medium text-[#C8A35A] transition hover:text-[#E0C48A] disabled:opacity-50"
            >
              {resending
                ? "Sending new code..."
                : "Resend verification code"}
            </button>

            <button
              type="button"
              onClick={goBack}
              className="text-[14px] text-white/50 transition hover:text-white"
            >
              Back to admin sign in
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
