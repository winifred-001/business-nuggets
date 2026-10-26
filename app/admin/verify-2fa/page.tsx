"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";

import {
  clearPendingAdminLogin,
  getPendingAdminLogin,
  isAdminAccount,
  storeAdminSession,
  type AdminUser,
  type PendingAdminLogin,
} from "@/lib/admin-auth";

type LoginResponse = {
  message?: string | string[];
  authenticated?: boolean;
  user?: AdminUser;
};

function responseMessage(data: LoginResponse, fallback: string) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  return data.message || fallback;
}

export default function AdminVerifyTwoFactorPage() {
  const router = useRouter();

  const [pending, setPending] = useState<PendingAdminLogin | null>(null);
  const [ready, setReady] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const login = getPendingAdminLogin();

    if (!login) {
      router.replace("/admin/login");
      return;
    }

    setPending(login);
    setReady(true);
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pending) return;

    const normalizedCode = code.trim();

    if (useRecoveryCode) {
      if (!/^BN-[A-Z2-9]{5}-[A-Z2-9]{5}$/i.test(normalizedCode)) {
        setError("Enter a valid recovery code in the format BN-XXXXX-XXXXX.");
        return;
      }
    } else if (!/^\d{6}$/.test(normalizedCode)) {
      setError("Enter the 6-digit code from your authenticator app.");
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
          email: pending.email,
          password: pending.password,
          keepSignedIn: pending.keepSignedIn,
          ...(useRecoveryCode
            ? { recoveryCode: normalizedCode.toUpperCase() }
            : { twoFactorToken: normalizedCode }),
        }),
      });

      const data: LoginResponse = await response.json().catch(() => ({}));

      if (!response.ok || !data.authenticated || !data.user) {
        setError(
          responseMessage(
            data,
            useRecoveryCode
              ? "The recovery code could not be verified."
              : "The authentication code could not be verified.",
          ),
        );
        return;
      }

      if (!isAdminAccount(data.user)) {
        clearPendingAdminLogin();
        setError("This account does not have Admin Console access.");
        return;
      }

      const verifyResponse = await fetch(
        "/api/admin/auth/session",
        {
          cache: "no-store",
        },
      );

      if (!verifyResponse.ok) {
        setError("Admin access could not be verified.");
        return;
      }

      storeAdminSession("", data.user, pending.keepSignedIn);
      clearPendingAdminLogin();
      router.replace("/admin/dashboard");
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    clearPendingAdminLogin();
    router.replace("/admin/login");
  }

  if (!ready || !pending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-[11px] text-white/40">
        Preparing secure verification...
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
              <p className="mt-0.5 text-[8px] text-[#C8A35A]">Admin Console</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-72px)] items-start justify-center px-5 py-16 sm:py-20">
        <section className="w-full max-w-[440px] rounded-[10px] border border-white/10 bg-[#111111] p-6 sm:p-8">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-[#C8A35A]/15 text-[#C8A35A]">
            {useRecoveryCode ? <KeyRound size={20} /> : <ShieldCheck size={20} />}
          </div>

          <div className="mt-5 text-center">
            <h1 className="font-serif text-[28px] leading-tight">
              {useRecoveryCode ? "Use Recovery Code" : "Two-Factor Verification"}
            </h1>
            <p className="mt-2 text-[11px] leading-5 text-white/35">
              {useRecoveryCode
                ? "Enter one unused recovery code for this admin account."
                : "Enter the 6-digit code from your authenticator app."}
            </p>
            <p className="mt-2 text-[9px] text-white/25">{pending.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7">
            <label
              htmlFor="two-factor-code"
              className="mb-2 block text-[9px] font-medium text-white/45"
            >
              {useRecoveryCode ? "Recovery code" : "Authentication code"}
            </label>

            <input
              id="two-factor-code"
              type="text"
              inputMode={useRecoveryCode ? "text" : "numeric"}
              autoComplete="one-time-code"
              value={code}
              maxLength={useRecoveryCode ? 13 : 6}
              onChange={(event) => {
                const value = useRecoveryCode
                  ? event.target.value.toUpperCase()
                  : event.target.value.replace(/\D/g, "");
                setCode(value);
                setError("");
              }}
              placeholder={useRecoveryCode ? "BN-XXXXX-XXXXX" : "000000"}
              className={`h-12 w-full rounded-md border border-white/10 bg-[#0D0D0D] px-4 text-center text-white outline-none placeholder:text-white/15 focus:border-[#C8A35A]/50 ${
                useRecoveryCode
                  ? "text-[14px] tracking-[0.08em]"
                  : "text-[20px] tracking-[0.35em]"
              }`}
            />

            {error && (
              <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                <p className="text-[10px] leading-5 text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex min-h-10 w-full items-center justify-center rounded-md bg-[#C8A35A] px-4 text-[10px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Open Admin Console"}
            </button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-3 border-t border-white/[0.07] pt-5">
            <button
              type="button"
              onClick={() => {
                setUseRecoveryCode((current) => !current);
                setCode("");
                setError("");
              }}
              className="text-[10px] text-[#C8A35A] transition hover:text-[#E0C48A]"
            >
              {useRecoveryCode
                ? "Use authenticator code instead"
                : "Use a recovery code instead"}
            </button>

            <button
              type="button"
              onClick={goBack}
              className="text-[9px] text-white/35 transition hover:text-white/60"
            >
              Back to admin sign in
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
