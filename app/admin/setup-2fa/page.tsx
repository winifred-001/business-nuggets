"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";

import { API_URL } from "@/lib/api";
import {
  clearPendingAdminSetup,
  getPendingAdminSetup,
  type PendingAdminSetup,
} from "@/lib/admin-auth";

type SetupResponse = {
  message?: string | string[];
  secret?: string;
  otpauthUrl?: string;
};

type ConfirmResponse = {
  message?: string | string[];
  recoveryCodes?: string[];
};

function messageFrom(
  data: { message?: string | string[] },
  fallback: string,
) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  return data.message || fallback;
}

export default function AdminSetupTwoFactorPage() {
  const router = useRouter();
  const startedRef = useRef(false);

  const [pending, setPending] = useState<PendingAdminSetup | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const setup = getPendingAdminSetup();

    if (!setup) {
      router.replace("/admin/login");
      return;
    }

    const setupToken = setup.setupToken;
    setPending(setup);

    async function beginSetup() {
      try {
        const response = await fetch(`${API_URL}/auth/2fa/setup-required`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            setupToken,
          }),
        });

        const data: SetupResponse = await response.json().catch(() => ({}));

        if (!response.ok || !data.secret || !data.otpauthUrl) {
          setError(messageFrom(data, "Could not start two-factor setup."));
          return;
        }

        setSecret(data.secret);
        setOtpauthUrl(data.otpauthUrl);
      } catch {
        setError("Could not connect to the server.");
      } finally {
        setLoadingSetup(false);
      }
    }

    void beginSetup();
  }, [router]);

  async function confirmSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pending) return;

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setConfirming(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/2fa/confirm-required`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          setupToken: pending.setupToken,
          token: code,
        }),
      });

      const data: ConfirmResponse = await response.json().catch(() => ({}));

      if (!response.ok || !Array.isArray(data.recoveryCodes)) {
        setError(messageFrom(data, "Could not confirm two-factor setup."));
        return;
      }

      setRecoveryCodes(data.recoveryCodes);
      clearPendingAdminSetup();
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setConfirming(false);
    }
  }

  async function copyRecoveryCodes() {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function returnToLogin() {
    clearPendingAdminSetup();
    router.replace("/admin/login");
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

      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[760px] items-start justify-center px-5 py-12 sm:py-16">
        <section className="w-full rounded-[10px] border border-white/10 bg-[#111111] p-6 sm:p-8">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-[#C8A35A]/15 text-[#C8A35A]">
            <ShieldCheck size={20} />
          </div>

          <div className="mt-5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#C8A35A]">
              Required Security Setup
            </p>
            <h1 className="mt-2 font-serif text-[28px] leading-tight">
              Set Up Two-Factor Authentication
            </h1>
            <p className="mx-auto mt-3 max-w-[560px] text-[11px] leading-6 text-white/35">
              Add this Business Nuggets account to an authenticator app, then enter the current 6-digit code to finish setup.
            </p>
            {pending?.user.email && (
              <p className="mt-2 text-[9px] text-white/25">{pending.user.email}</p>
            )}
          </div>

          {loadingSetup ? (
            <p className="py-12 text-center text-[11px] text-white/35">
              Generating your secure setup key...
            </p>
          ) : recoveryCodes.length > 0 ? (
            <div className="mt-8">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check size={15} />
                  <p className="text-[11px] font-semibold">Two-factor authentication is enabled.</p>
                </div>
                <p className="mt-2 text-[10px] leading-5 text-white/40">
                  Save these recovery codes somewhere secure. Each code can only be used once, and the backend will not show these plain codes again.
                </p>
              </div>

              <div className="mt-5 grid gap-2 rounded-lg border border-white/10 bg-[#0D0D0D] p-4 sm:grid-cols-2">
                {recoveryCodes.map((recoveryCode) => (
                  <code
                    key={recoveryCode}
                    className="rounded border border-white/[0.07] bg-[#151515] px-3 py-2 text-center text-[11px] tracking-[0.08em] text-[#E0C48A]"
                  >
                    {recoveryCode}
                  </code>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => void copyRecoveryCodes()}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 px-4 text-[10px] text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy recovery codes"}
                </button>

                <button
                  type="button"
                  onClick={returnToLogin}
                  className="min-h-10 rounded-md bg-[#C8A35A] px-5 text-[10px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
                >
                  I Saved Them — Continue to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mt-6 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                  <p className="text-[10px] leading-5 text-red-400">{error}</p>
                </div>
              )}

              {secret && otpauthUrl && (
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-[#0D0D0D] p-5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                      1. Add to authenticator
                    </p>
                    <p className="mt-3 text-[10px] leading-5 text-white/40">
                      Open Google Authenticator, Microsoft Authenticator, Authy, or another TOTP app and add this account.
                    </p>

                    <a
                      href={otpauthUrl}
                      className="mt-4 inline-flex rounded-md border border-[#C8A35A]/30 px-4 py-2.5 text-[10px] text-[#C8A35A] transition hover:bg-[#C8A35A]/10"
                    >
                      Open in authenticator app
                    </a>

                    <div className="mt-4">
                      <p className="text-[8px] uppercase tracking-[0.08em] text-white/25">
                        Manual setup key
                      </p>
                      <code className="mt-2 block break-all rounded-md border border-white/[0.07] bg-[#151515] p-3 text-[11px] leading-5 text-white/70">
                        {secret}
                      </code>
                    </div>
                  </div>

                  <form
                    onSubmit={confirmSetup}
                    className="rounded-lg border border-white/10 bg-[#0D0D0D] p-5"
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#C8A35A]">
                      2. Verify the setup
                    </p>
                    <p className="mt-3 text-[10px] leading-5 text-white/40">
                      Enter the current 6-digit code generated by the authenticator app.
                    </p>

                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value.replace(/\D/g, ""));
                        setError("");
                      }}
                      placeholder="000000"
                      className="mt-5 h-12 w-full rounded-md border border-white/10 bg-[#151515] px-4 text-center text-[20px] tracking-[0.35em] text-white outline-none placeholder:text-white/15 focus:border-[#C8A35A]/50"
                    />

                    <button
                      type="submit"
                      disabled={confirming || code.length !== 6}
                      className="mt-4 min-h-10 w-full rounded-md bg-[#C8A35A] px-4 text-[10px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:opacity-50"
                    >
                      {confirming ? "Confirming..." : "Enable Two-Factor Authentication"}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
