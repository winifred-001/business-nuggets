"use client";

import PasswordInput from "@/components/PasswordInput";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { API_URL } from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [tokenReady, setTokenReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
    setTokenReady(true);
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token) {
      setError(
        "This password reset link is missing or invalid. Request a new one.",
      );
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Could not reset your password. The link may have expired.",
        );
        return;
      }

      router.replace("/password-reset-success");
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#FAF9F6]">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6 sm:py-14 md:px-8 lg:px-10 lg:py-16">
        <section className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-8 md:p-10">
          <h1 className="bn-hero-title font-serif text-[40px] leading-tight">
            Reset Password
          </h1>

          <p className="mt-4 text-[16px] leading-7 text-white/50">
            Choose a new password for your Business Nuggets account.
          </p>

          {tokenReady && !token ? (
            <div className="mt-6">
              <p
                role="alert"
                className="rounded-lg border border-[#B54A4A]/30 bg-[#B54A4A]/10 px-4 py-3 text-[14px] leading-6 text-[#D98383]"
              >
                This reset link is missing its token or is no longer valid.
              </p>

              <Link
                href="/forgot-password"
                className="bn-button mt-5 flex min-h-12 w-full items-center justify-center rounded-lg bg-[#C8A35A] px-5 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
              >
                Request a New Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-[14px] font-medium text-white/70"
                >
                  New password
                </label>

                <PasswordInput
                  visibilityLabel="new password" aria-label="New password"
                  id="new-password"

                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setError("");
                  }}
                  minLength={8}
                  required
                  className="h-12 w-full rounded-lg border border-white/10 bg-[#080808] px-4 text-[16px] text-[#FAF9F6] outline-none focus:border-[#C8A35A]"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-[14px] font-medium text-white/70"
                >
                  Confirm new password
                </label>

                <PasswordInput
                  visibilityLabel="confirm password" aria-label="Confirm password"
                  id="confirm-password"

                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError("");
                  }}
                  minLength={8}
                  required
                  className="h-12 w-full rounded-lg border border-white/10 bg-[#080808] px-4 text-[16px] text-[#FAF9F6] outline-none focus:border-[#C8A35A]"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-[#B54A4A]/30 bg-[#B54A4A]/10 px-4 py-3 text-[14px] leading-6 text-[#D98383]"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !tokenReady}
                className="min-h-12 w-full rounded-lg bg-[#C8A35A] px-5 text-[15px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="bn-button mt-4 flex min-h-12 w-full items-center justify-center rounded-lg border border-white/10 bg-[#080808] px-4 text-[14px] font-medium text-white/65 transition hover:border-[#C8A35A]/35 hover:text-[#E0C48A]"
          >
            Back to Sign In
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
